#!/usr/bin/env node
/**
 * Read-only production edge preflight: DNS, TLS SAN/expiry, ALPN HTTP/2,
 * HSTS and application health. It never sends credentials and never mutates
 * production state.
 */
import tls from 'node:tls';
import dns from 'node:dns/promises';
import https from 'node:https';

const targets = [
  { name: 'app', host: 'det-academy.ru', path: '/', expectStatus: 200 },
  { name: 'directus', host: 'directus.det-academy.ru', path: '/server/health', expectStatus: 200 },
];

const checkTls = (host) =>
  new Promise((resolve) => {
    const socket = tls.connect(
      { host, port: 443, servername: host, ALPNProtocols: ['h2', 'http/1.1'], rejectUnauthorized: false, timeout: 10000 },
      () => {
        const cert = socket.getPeerCertificate();
        const identityError = tls.checkServerIdentity(host, cert);
        const daysLeft = Math.floor((new Date(cert.valid_to).getTime() - Date.now()) / 86400000);
        resolve({
          authorized: socket.authorized,
          identityError: identityError ? identityError.message : null,
          subject: cert.subject?.CN || null,
          san: cert.subjectaltname || null,
          validTo: cert.valid_to || null,
          daysLeft,
          alpn: socket.alpnProtocol || null,
        });
        socket.end();
      }
    );
    socket.on('timeout', () => { socket.destroy(); resolve({ error: 'TLS timeout' }); });
    socket.on('error', (error) => resolve({ error: error.message }));
  });

const checkHttp = (host, path) =>
  new Promise((resolve) => {
    const req = https.get(
      { host, path, servername: host, timeout: 10000, headers: { 'User-Agent': 'det-academy-edge-preflight/1.0' } },
      (res) => {
        resolve({
          status: res.statusCode,
          server: res.headers.server || null,
          hsts: res.headers['strict-transport-security'] || null,
          contentType: res.headers['content-type'] || null,
          securityHeaders: {
            xContentTypeOptions: res.headers['x-content-type-options'] || null,
            xFrameOptions: res.headers['x-frame-options'] || null,
            referrerPolicy: res.headers['referrer-policy'] || null,
            contentSecurityPolicy: res.headers['content-security-policy'] || null,
            permissionsPolicy: res.headers['permissions-policy'] || null,
          },
        });
        res.resume();
      }
    );
    req.on('timeout', () => { req.destroy(); resolve({ error: 'HTTP timeout' }); });
    req.on('error', (error) => resolve({ error: error.message }));
  });

const results = [];
for (const target of targets) {
  const [addresses, tlsResult, httpResult] = await Promise.all([
    dns.resolve4(target.host).catch(() => []),
    checkTls(target.host),
    checkHttp(target.host, target.path),
  ]);
  const checks = {
    dns: addresses.length > 0,
    certificateMatchesHostname: tlsResult.identityError === null && !tlsResult.error,
    certificateValid: (tlsResult.daysLeft ?? -1) > 14,
    http2: tlsResult.alpn === 'h2',
    hsts: Boolean(httpResult.hsts),
    xContentTypeOptions: Boolean(httpResult.securityHeaders?.xContentTypeOptions),
    xFrameOptions: Boolean(httpResult.securityHeaders?.xFrameOptions),
    referrerPolicy: Boolean(httpResult.securityHeaders?.referrerPolicy),
    contentSecurityPolicy: Boolean(httpResult.securityHeaders?.contentSecurityPolicy),
    permissionsPolicy: Boolean(httpResult.securityHeaders?.permissionsPolicy),
    httpStatus: httpResult.status === target.expectStatus,
  };
  results.push({ target: target.name, host: target.host, addresses, tls: tlsResult, http: httpResult, checks, ok: Object.values(checks).every(Boolean) });
}

console.log(JSON.stringify({ status: results.every((r) => r.ok) ? 'ok' : 'blocked', results }, null, 2));
process.exit(results.every((r) => r.ok) ? 0 : 1);
