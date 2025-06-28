# Contact Form Integration Guide

## Overview
This guide explains how to integrate the Maxsys International website contact form with your WordPress Contact Form 7 setup at https://give.maxsys.org.

## Current Setup
- **Contact Form ID**: 2927
- **WordPress Site**: https://give.maxsys.org
- **Form Type**: Contact Form 7 (CF7)

## Required Backend Configuration

### 1. WordPress Contact Form 7 Setup

#### A. Verify Contact Form 7 Plugin
Ensure Contact Form 7 is installed and activated:
```bash
# Check if CF7 is active in WordPress admin
wp plugin list --status=active | grep contact-form-7
```

#### B. Configure Form Fields (Form ID: 2927)
Your CF7 form should have these field names to match the frontend:

```
[text* your-first-name placeholder "First Name"]
[text* your-last-name placeholder "Last Name"] 
[email* your-email placeholder "Email Address"]
[text your-organization placeholder "Organization (Optional)"]
[select* inquiry-type "Select an option" "General Information" "Need Tech Support" "Become a Tech Steward" "Become a Tech Hub Partner" "Corporate Partnership" "Media Inquiry" "Other"]
[textarea* your-message placeholder "Tell us about your needs, questions, or how you'd like to get involved..."]
[submit "Send Message"]
```

### 2. Enable REST API Access

#### A. Install CF7 REST API Plugin
```bash
# Install via WP-CLI
wp plugin install contact-form-7-rest-api --activate

# Or install manually from WordPress admin:
# Plugins > Add New > Search "Contact Form 7 REST API"
```

#### B. Verify REST API Endpoint
Test the endpoint is accessible:
```bash
curl https://give.maxsys.org/wp-json/contact-form-7/v1/contact-forms/2927
```

### 3. Configure CORS Headers

#### A. Add to .htaccess (if using Apache)
```apache
# Add to your WordPress .htaccess file
<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "https://maxsys.org"
    Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
    Header always set Access-Control-Allow-Credentials "true"
</IfModule>
```

#### B. Or add to WordPress functions.php
```php
// Add to your theme's functions.php
function add_cors_http_header(){
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        $allowed_origins = array(
            'https://maxsys.org',
            'https://www.maxsys.org'
        );
        
        if (in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
            header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
        }
    }
    
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Allow-Credentials: true");
}
add_action('init','add_cors_http_header');
```

### 4. Email Configuration

#### A. Configure CF7 Email Settings
In WordPress admin, go to Contact > Contact Forms > Edit form 2927:

**Mail Tab:**
```
To: info@maxsys.org
From: [your-email]
Subject: New Contact Form Submission - [inquiry-type]

Message Body:
Name: [your-first-name] [your-last-name]
Email: [your-email]
Organization: [your-organization]
Inquiry Type: [inquiry-type]

Message:
[your-message]

---
Sent from: maxsys.org contact form
```

**Mail (2) Tab (Optional Auto-Reply):**
```
To: [your-email]
From: info@maxsys.org
Subject: Thank you for contacting Maxsys International

Message Body:
Hello [your-first-name],

Thank you for reaching out to Maxsys International. We've received your message and will respond within 24 hours.

Your inquiry type: [inquiry-type]

Best regards,
The Maxsys Team
```

### 5. Security Considerations

#### A. Rate Limiting
Add rate limiting to prevent spam:
```php
// Add to functions.php
function cf7_rate_limit() {
    $ip = $_SERVER['REMOTE_ADDR'];
    $transient_key = 'cf7_rate_limit_' . md5($ip);
    
    if (get_transient($transient_key)) {
        wp_die('Too many requests. Please wait before submitting again.');
    }
    
    set_transient($transient_key, true, 60); // 1 minute limit
}
add_action('wpcf7_before_send_mail', 'cf7_rate_limit');
```

#### B. Spam Protection
Enable reCAPTCHA or similar:
```bash
# Install reCAPTCHA plugin
wp plugin install contact-form-7-recaptcha --activate
```

### 6. Testing the Integration

#### A. Test Form Submission
```bash
# Test the API endpoint
curl -X POST https://give.maxsys.org/wp-json/contact-form-7/v1/contact-forms/2927/feedback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "your-first-name=Test&your-last-name=User&your-email=test@example.com&inquiry-type=General Information&your-message=Test message"
```

#### B. Check Email Delivery
1. Submit a test form
2. Check info@maxsys.org for the email
3. Verify auto-reply is sent to submitter

### 7. Monitoring and Logs

#### A. Enable CF7 Logging
```php
// Add to functions.php for debugging
function cf7_log_submissions($contact_form) {
    $submission = WPCF7_Submission::get_instance();
    $posted_data = $submission->get_posted_data();
    
    error_log('CF7 Submission: ' . print_r($posted_data, true));
}
add_action('wpcf7_mail_sent', 'cf7_log_submissions');
```

#### B. Monitor Failed Submissions
Check WordPress error logs for failed submissions:
```bash
tail -f /path/to/wordpress/wp-content/debug.log
```

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure CORS headers are properly configured
2. **404 on API**: Verify CF7 REST API plugin is installed
3. **Form Not Found**: Check form ID 2927 exists
4. **Email Not Sending**: Verify SMTP configuration
5. **Rate Limiting**: Check if IP is being blocked

### Debug Steps:

1. Test API endpoint directly
2. Check WordPress error logs
3. Verify form field names match
4. Test email configuration
5. Check CORS headers in browser dev tools

## Maintenance

### Regular Tasks:
- Monitor form submissions
- Check email delivery
- Update plugins
- Review spam submissions
- Backup form configurations

### Updates:
- Keep CF7 and REST API plugins updated
- Monitor for security patches
- Test form after WordPress updates

## Support

If you encounter issues:
1. Check WordPress error logs
2. Test API endpoints manually
3. Verify email configuration
4. Contact your hosting provider for server-level issues

For additional help, contact the development team with specific error messages and logs.