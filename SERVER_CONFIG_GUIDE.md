# Server Configuration Guide
## Pengeluaranqu PWA - Production Deployment

**Tanggal:** 30 September 2025  
**Tujuan:** Konfigurasi server untuk security headers yang optimal

---

## 🚀 Apache Server Configuration

### File: `.htaccess` (sudah disediakan)

File `.htaccess` yang telah dibuat berisi konfigurasi security headers yang diperlukan:

- **Content Security Policy** dengan `frame-ancestors 'none'`
- **X-Frame-Options** dengan `DENY`
- **X-Content-Type-Options** dengan `nosniff`
- **X-XSS-Protection** dengan filtering enabled
- **Referrer Policy** untuk privacy
- **Permissions Policy** untuk restricting browser APIs

### Aktivasi pada Apache:

```bash
# Pastikan mod_headers enabled
sudo a2enmod headers
sudo systemctl restart apache2
```

---

## 🌐 Nginx Server Configuration

### File: `nginx.conf` atau site configuration

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration (required for production)
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    
    # Security Headers
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;
    
    # HSTS (enable after SSL setup)
    # add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # Root directory
    root /var/www/pengeluaranqu;
    index index.html;
    
    # PWA Service Worker
    location /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Service-Worker-Allowed "/";
    }
    
    # Static assets caching
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Fallback to index.html for SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## ☁️ CDN Configuration (Cloudflare)

### Security Settings dalam Cloudflare Dashboard:

1. **SSL/TLS**: Full (Strict)
2. **Security Level**: Medium
3. **Browser Integrity Check**: ON
4. **Challenge Passage**: 30 minutes
5. **Privacy Pass Support**: ON

### Page Rules untuk PWA:

```
Pattern: your-domain.com/sw.js
Settings:
- Cache Level: Bypass
- Disable Apps
- Disable Performance
```

```
Pattern: your-domain.com/*
Settings:
- Browser Cache TTL: 4 hours
- Cache Level: Standard
- Security Level: Medium
```

---

## 🐳 Docker Configuration

### Dockerfile untuk production:

```dockerfile
FROM nginx:alpine

# Copy application files
COPY . /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set permissions
RUN chown -R nextjs:nodejs /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html

USER nextjs

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml untuk development:

```yaml
version: '3.8'
services:
  pengeluaranqu:
    build: .
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
    volumes:
      - ./logs:/var/log/nginx
    restart: unless-stopped
```

---

## 🔐 SSL Certificate Setup

### Let's Encrypt (Certbot):

```bash
# Install certbot
sudo apt install certbot python3-certbot-apache

# Obtain certificate
sudo certbot --apache -d your-domain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

### Manual Certificate Installation:

1. Obtain SSL certificate from provider
2. Update server configuration with certificate paths
3. Enable HSTS header setelah SSL aktif
4. Test SSL configuration: https://www.ssllabs.com/ssltest/

---

## 📊 Security Testing Checklist

### Automated Testing Tools:

```bash
# Test security headers
curl -I https://your-domain.com

# Test SSL configuration
nmap --script ssl-enum-ciphers -p 443 your-domain.com

# Test CSP
# Use browser developer tools or online CSP analyzers
```

### Online Security Scanners:

- **Mozilla Observatory**: https://observatory.mozilla.org/
- **SSL Labs**: https://www.ssllabs.com/ssltest/
- **Security Headers**: https://securityheaders.com/
- **CSP Evaluator**: https://csp-evaluator.withgoogle.com/

---

## 🚨 Error Handling

### Common Issues & Solutions:

**1. CSP Violations:**
```javascript
// Monitor CSP violations
document.addEventListener('securitypolicyviolation', (e) => {
  console.error('CSP Violation:', e.violatedDirective, e.blockedURI);
});
```

**2. Mixed Content Errors:**
- Ensure all resources load over HTTPS
- Update any HTTP links to HTTPS
- Use protocol-relative URLs where appropriate

**3. Service Worker CORS:**
```javascript
// In sw.js - handle CORS for cross-origin requests
self.addEventListener('fetch', event => {
  if (event.request.mode === 'cors') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Add CORS headers if needed
          return response;
        })
    );
  }
});
```

---

## 📈 Performance Optimization

### Server-side Optimizations:

1. **Enable Gzip/Brotli Compression**
2. **Configure Browser Caching**
3. **Optimize Static Asset Delivery**
4. **Enable HTTP/2**
5. **Implement CDN**

### Application-level Optimizations:

1. **Code Splitting** (untuk future updates)
2. **Lazy Loading** untuk images
3. **Service Worker Optimization**
4. **Database Query Optimization** (saat backend implemented)

---

## 🔄 Deployment Process

### Production Deployment Steps:

1. **Pre-deployment:**
   ```bash
   # Run tests (jika ada)
   npm test
   
   # Build optimization (jika diperlukan)
   npm run build
   
   # Security audit
   npm audit
   ```

2. **Deployment:**
   ```bash
   # Backup current version
   cp -r /var/www/pengeluaranqu /var/www/pengeluaranqu.backup
   
   # Deploy new version
   rsync -av --delete ./ /var/www/pengeluaranqu/
   
   # Set permissions
   chown -R www-data:www-data /var/www/pengeluaranqu
   ```

3. **Post-deployment:**
   ```bash
   # Test application
   curl -f https://your-domain.com
   
   # Check logs
   tail -f /var/log/nginx/access.log
   
   # Verify security headers
   curl -I https://your-domain.com
   ```

---

## 📱 PWA Deployment Considerations

### Service Worker Updates:

```javascript
// Handle service worker updates gracefully
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      registration.addEventListener('updatefound', () => {
        // Notify user about updates
        showUpdateAvailable();
      });
    });
}
```

### Manifest Validation:

- Test PWA installability
- Verify icons display correctly
- Test offline functionality
- Validate manifest.json structure

---

## 🎯 Final Checklist

### Before Going Live:

- [ ] SSL certificate installed and tested
- [ ] All security headers configured
- [ ] CSP policy tested and refined
- [ ] Performance optimization applied
- [ ] Error monitoring configured
- [ ] Backup procedures established
- [ ] Auto-renewal for SSL configured
- [ ] CDN configured (if using)
- [ ] Domain DNS properly configured
- [ ] PWA functionality tested
- [ ] Cross-browser compatibility verified

### Monitoring & Maintenance:

- [ ] Set up uptime monitoring
- [ ] Configure error logging
- [ ] Schedule regular security audits
- [ ] Plan update deployment process
- [ ] Monitor performance metrics
- [ ] Regular backup verification

---

**Status:** Ready for Production Deployment  
**Security Grade Target:** A+ (Mozilla Observatory)  
**Performance Target:** >90 (Google PageSpeed Insights)