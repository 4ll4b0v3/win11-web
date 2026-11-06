<?php
/*
 * webproxy.php - small PHP web proxy for the Win11 Web Browser app.
 *
 * Usage:  webproxy.php?url=https://example.com/
 *
 * - Fetches the page with cURL, strips frame-blocking headers (X-Frame-Options, CSP)
 * - Rewrites links / images / forms / CSS urls in HTML and CSS so they keep going through this script
 * - Injects a tiny script that routes fetch(), XHR and GET forms through the proxy as well
 * - Blocks requests to private / internal addresses (SSRF protection)
 *
 * Upload to your host (needs PHP with the cURL extension).
 * NOTE: this is an open proxy. See $ALLOWED_HOSTS below if you want to lock it down.
 */

error_reporting(0);
@set_time_limit(40);

$MAX_BYTES     = 15 * 1024 * 1024;  // max response size
$TIMEOUT       = 25;                // seconds
$ALLOWED_HOSTS = [];                // e.g. ['wikipedia.org', 'example.com'] - empty = any public host

$self = $_SERVER['SCRIPT_NAME'];
$selfFull = ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . $self;

function px($u) { global $selfFull; return $selfFull . '?url=' . rawurlencode($u); }

function fail($code, $msg) {
    http_response_code($code);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><meta charset="utf-8"><body style="font-family:Segoe UI,system-ui,sans-serif;padding:32px;color:#1f2937">'
       . '<h2>Proxy error</h2><p>' . htmlspecialchars($msg) . '</p></body>';
    exit;
}

/* Resolve $rel against absolute URL $base. */
function resolve($rel, $base) {
    $rel = trim($rel);
    if ($rel === '') return $base;
    if (preg_match('#^https?://#i', $rel)) return $rel;
    $b = parse_url($base);
    if (!$b || empty($b['host'])) return $rel;
    $origin = $b['scheme'] . '://' . $b['host'] . (isset($b['port']) ? ':' . $b['port'] : '');
    if (strpos($rel, '//') === 0) return $b['scheme'] . ':' . $rel;
    if ($rel[0] === '/') return $origin . $rel;
    if ($rel[0] === '?') return $origin . ($b['path'] ?? '/') . $rel;
    $path = $b['path'] ?? '/';
    $dir = substr($path, 0, strrpos($path, '/') + 1);
    $full = $dir . $rel;
    // normalise ./ and ../ (keep query/fragment intact)
    $suffix = '';
    if (preg_match('/^([^?#]*)([?#].*)$/s', $full, $m)) { $full = $m[1]; $suffix = $m[2]; }
    $out = [];
    foreach (explode('/', $full) as $seg) {
        if ($seg === '..') { if (count($out) > 1) array_pop($out); }
        elseif ($seg !== '.') $out[] = $seg;
    }
    return $origin . implode('/', $out) . $suffix;
}

function skip_url($u) {
    $u = trim($u);
    return $u === '' || $u[0] === '#' || preg_match('#^(javascript|data|mailto|tel|blob|about|sms):#i', $u);
}

/* Make an absolute proxied URL for a (possibly relative) reference. */
function proxify($rel, $base) {
    if (skip_url($rel)) return $rel;
    $rel = html_entity_decode($rel, ENT_QUOTES);
    $abs = resolve($rel, $base);
    $frag = '';
    if (($p = strpos($abs, '#')) !== false) { $frag = substr($abs, $p); $abs = substr($abs, 0, $p); }
    return px($abs) . $frag;
}

function rewrite_css($css, $base) {
    $css = preg_replace_callback('/url\(\s*([\'"]?)(.*?)\1\s*\)/is', function ($m) use ($base) {
        if (skip_url($m[2])) return $m[0];
        return 'url(' . $m[1] . proxify($m[2], $base) . $m[1] . ')';
    }, $css);
    $css = preg_replace_callback('/@import\s+([\'"])(.*?)\1/i', function ($m) use ($base) {
        return '@import ' . $m[1] . proxify($m[2], $base) . $m[1];
    }, $css);
    return $css;
}

function rewrite_html($html, $base) {
    global $selfFull;

    // <base href> changes how relative URLs resolve - honour it, then drop it
    if (preg_match('/<base\s[^>]*href\s*=\s*["\']([^"\']+)["\']/i', $html, $bm)) {
        $base = resolve(html_entity_decode($bm[1], ENT_QUOTES), $base);
    }
    $html = preg_replace('/<base\b[^>]*>/i', '', $html);
    // remove things that would break once the page is proxied
    $html = preg_replace('/<meta[^>]+http-equiv\s*=\s*["\']?content-security-policy[^>]*>/i', '', $html);
    $html = preg_replace('/\s(integrity|crossorigin)\s*=\s*("[^"]*"|\'[^\']*\')/i', '', $html);

    // href / src / action / poster / data-src
    $html = preg_replace_callback('/(\s)(href|src|action|poster|data-src)(\s*=\s*)(["\'])(.*?)\4/is', function ($m) use ($base) {
        if (skip_url($m[5])) return $m[0];
        if (strtolower($m[2]) === 'action') {
            $abs = resolve(html_entity_decode($m[5], ENT_QUOTES), $base);
            return $m[1] . 'data-px-action="' . htmlspecialchars($abs, ENT_QUOTES) . '" action=' . $m[4] . htmlspecialchars(px($abs), ENT_QUOTES) . $m[4];
        }
        return $m[1] . $m[2] . $m[3] . $m[4] . htmlspecialchars(proxify($m[5], $base), ENT_QUOTES) . $m[4];
    }, $html);

    // srcset
    $html = preg_replace_callback('/(\ssrcset\s*=\s*)(["\'])(.*?)\2/is', function ($m) use ($base) {
        $parts = array_map(function ($p) use ($base) {
            $p = trim($p);
            if ($p === '') return $p;
            $bits = preg_split('/\s+/', $p, 2);
            $bits[0] = proxify($bits[0], $base);
            return implode(' ', $bits);
        }, explode(',', $m[3]));
        return $m[1] . $m[2] . htmlspecialchars(implode(', ', $parts), ENT_QUOTES) . $m[2];
    }, $html);

    // <style> blocks
    $html = preg_replace_callback('#(<style\b[^>]*>)(.*?)(</style>)#is', function ($m) use ($base) {
        return $m[1] . rewrite_css($m[2], $base) . $m[3];
    }, $html);

    // injected runtime helper
    $js = <<<'JS'
(function(){
var B=__BASE__,P=__SELF__;
function abs(u){try{return new URL(u,B).href}catch(e){return u}}
function px(u){u=String(u);if(/^(javascript|data|blob|mailto|tel|about):/i.test(u)||u.charAt(0)==='#')return u;u=abs(u);if(/^https?:/i.test(u)&&u.indexOf(P)!==0)return P+'?url='+encodeURIComponent(u);return u}
var f=window.fetch;if(f)window.fetch=function(i,o){try{if(typeof i==='string')i=px(i);else if(i&&i.url)i=new Request(px(i.url),i)}catch(e){}return f.call(this,i,o)};
var xo=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){arguments[1]=px(u);return xo.apply(this,arguments)};
var wo=window.open;window.open=function(u){arguments[0]=u?px(u):u;return wo.apply(this,arguments)};
document.addEventListener('submit',function(e){var fm=e.target;if(!fm||fm.tagName!=='FORM')return;if((fm.getAttribute('method')||'get').toLowerCase()!=='get')return;
e.preventDefault();var a=fm.getAttribute('data-px-action')||B;var u=new URL(a,B);u.search=new URLSearchParams(new FormData(fm)).toString();location.href=px(u.href)},true);
})();
JS;
    $js = str_replace(['__BASE__', '__SELF__'], [json_encode($base), json_encode($selfFull)], $js);
    $tag = '<script>' . $js . '</script>';
    $html = preg_replace('/<head\b[^>]*>/i', '$0' . $tag, $html, 1, $n);
    if (!$n) $html = $tag . $html;
    return $html;
}

/* ---------- landing page ---------- */
$target = isset($_GET['url']) ? trim($_GET['url']) : '';
if ($target === '') {
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><meta charset="utf-8"><title>Web proxy</title><body style="font-family:Segoe UI,system-ui,sans-serif;padding:32px">'
       . '<h2>Web proxy</h2><form method="get"><input name="url" placeholder="https://example.com" style="width:320px;padding:8px"> '
       . '<button style="padding:8px 14px">Go</button></form></body>';
    exit;
}
if (!preg_match('#^[a-z][a-z0-9+.-]*://#i', $target)) $target = 'https://' . $target;

$parts = parse_url($target);
if (!$parts || empty($parts['host']) || !in_array(strtolower($parts['scheme']), ['http', 'https'], true)) fail(400, 'Only http(s) URLs are supported.');
$host = strtolower($parts['host']);
$port = $parts['port'] ?? (strtolower($parts['scheme']) === 'https' ? 443 : 80);
if (isset($parts['user']) || isset($parts['pass'])) fail(400, 'Credentials in URLs are not supported.');
if (!in_array($port, [80, 443, 8080, 8443], true)) fail(403, 'That port is not allowed.');

if ($ALLOWED_HOSTS) {
    $ok = false;
    foreach ($ALLOWED_HOSTS as $a) { if ($host === $a || substr($host, -strlen($a) - 1) === '.' . $a) { $ok = true; break; } }
    if (!$ok) fail(403, 'This host is not allowed by the proxy.');
}

/* SSRF protection: only public IPv4 addresses; pin the resolved IP so DNS can't change underneath us */
if ($host[0] === '[') fail(403, 'IPv6 literals are not allowed.');
$ips = filter_var($host, FILTER_VALIDATE_IP) ? [$host] : (gethostbynamel($host) ?: []);
if (!$ips) fail(502, 'Could not resolve host: ' . $host);
foreach ($ips as $ip) {
    if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
        fail(403, 'Requests to private or internal addresses are blocked.');
    }
}

/* ---------- fetch ---------- */
$method = $_SERVER['REQUEST_METHOD'];
$hdrs = [];
$respHeaders = [];
$body = '';
$tooBig = false;

$ch = curl_init($target);
$reqH = ['Accept: ' . ($_SERVER['HTTP_ACCEPT'] ?? '*/*'), 'Accept-Language: ' . ($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? 'en-US,en;q=0.9')];
if (!empty($_SERVER['CONTENT_TYPE'])) $reqH[] = 'Content-Type: ' . $_SERVER['CONTENT_TYPE'];
curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST  => $method,
    CURLOPT_HTTPHEADER     => $reqH,
    CURLOPT_USERAGENT      => $_SERVER['HTTP_USER_AGENT'] ?? 'Mozilla/5.0',
    CURLOPT_FOLLOWLOCATION => false,           // redirects go back through the proxy (and the IP check)
    CURLOPT_ENCODING       => '',              // let cURL decode gzip/deflate/br
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT        => $TIMEOUT,
    CURLOPT_PROTOCOLS      => CURLPROTO_HTTP | CURLPROTO_HTTPS,
    CURLOPT_RESOLVE        => [$host . ':' . $port . ':' . $ips[0]],
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_HEADERFUNCTION => function ($c, $line) use (&$respHeaders) {
        if (stripos($line, 'HTTP/') === 0) $respHeaders = [];
        elseif (strpos($line, ':') !== false) { list($k, $v) = explode(':', $line, 2); $respHeaders[strtolower(trim($k))] = trim($v); }
        return strlen($line);
    },
    CURLOPT_WRITEFUNCTION  => function ($c, $chunk) use (&$body, &$tooBig, $MAX_BYTES) {
        $body .= $chunk;
        if (strlen($body) > $MAX_BYTES) { $tooBig = true; return 0; }
        return strlen($chunk);
    },
]);
if ($method !== 'GET' && $method !== 'HEAD') curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
if ($method === 'HEAD') curl_setopt($ch, CURLOPT_NOBODY, true);

curl_exec($ch);
$errno  = curl_errno($ch);
$err    = curl_error($ch);
$status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($tooBig) fail(413, 'The response was too large for the proxy.');
if ($errno && !$status) fail(502, 'Could not fetch the page: ' . $err);

/* redirects */
if ($status >= 300 && $status < 400 && !empty($respHeaders['location'])) {
    header('Location: ' . px(resolve($respHeaders['location'], $target)), true, $status);
    exit;
}

/* ---------- respond ---------- */
http_response_code($status ?: 200);
$ct = $respHeaders['content-type'] ?? 'application/octet-stream';
header('Content-Type: ' . $ct);
if (!empty($respHeaders['content-disposition'])) header('Content-Disposition: ' . $respHeaders['content-disposition']);
if (!empty($respHeaders['cache-control'])) header('Cache-Control: ' . $respHeaders['cache-control']);
header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: no-referrer');
// X-Frame-Options, Content-Security-Policy, Set-Cookie etc. are deliberately NOT forwarded.

if (stripos($ct, 'text/html') !== false || stripos($ct, 'application/xhtml') !== false) {
    echo rewrite_html($body, $target);
} elseif (stripos($ct, 'text/css') !== false) {
    echo rewrite_css($body, $target);
} else {
    echo $body;
}
