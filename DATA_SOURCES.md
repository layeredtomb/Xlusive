# 🔍 Data Sources & Integration Guide

This document explains all the data sources the Phone Number Leak Checker scans and how to configure real API access for each.

## 📊 Data Sources Checked

### 1. **Data Breach Databases** ✓
- **Have I Been Pwned** - Global breach database
- **DeHashed** - Compromised data search engine
- **IntelX** - Intelligence search with dark web monitoring

**Setup:**
```env
HIBP_API_KEY=your_hibp_key  # Get free at: https://haveibeenpwned.com/API/v3
DEHASHED_EMAIL=your@email.com
DEHASHED_API_KEY=your_key   # Get at: https://dehashed.com/api
INTELX_API_KEY=your_key     # Get at: https://intelx.io/
```

### 2. **People Search Websites** ✓
Scans major people-finder sites where phone numbers are publicly listed:
- Whitepages
- Spokeo
- Intelius
- BeenVerified
- TruthFinder
- Instant Checkmate
- PeopleFinders
- Radaris

**Integration Options:**
- Use official APIs (where available)
- Web scraping with proper permissions
- Data aggregation services (e.g., People Data Labs)

### 3. **Family History Websites** ✓
Checks genealogy and family tree databases:
- Ancestry.com
- MyHeritage
- FamilySearch
- Findmypast
- 23andMe
- Archives.com

**Note:** Phone numbers may appear in:
- Public family trees
- Obituary records
- User-submitted genealogy data
- Historical documents

### 4. **Social Media Platforms** ✓
Monitors known social media data breaches:
- Facebook (2021 breach - 533M users)
- LinkedIn (2021 scraped data - 700M users)
- Twitter (2022 breach)
- Instagram
- TikTok
- Snapchat

### 5. **Public Records Databases** ✓
Government and public record sources:
- Voter Registration Databases
- Property Records (County Assessor)
- Court Records
- Business Licenses
- Professional Licenses
- Campaign Donation Records (FEC)

### 6. **Additional Sources** (Coming Soon)
- Dark web monitoring
- Paste sites (Pastebin, etc.)
- Telegram data leaks
- WhatsApp group exposures
- Marketing databases
- Telemarketing lists
- Credit header data
- Utility company records

## 🚀 How to Enable Real API Access

### Step 1: Get API Keys

#### Have I Been Pwned (FREE)
1. Go to https://haveibeenpwned.com/API/v3
2. Purchase an API key ($3.99/month)
3. Add to `.env` file:
   ```
   HIBP_API_KEY=your_key_here
   ```

#### DeHashed (PAID)
1. Visit https://dehashed.com
2. Create account and purchase credits
3. Get API credentials from dashboard
4. Add to `.env`:
   ```
   DEHASHED_EMAIL=your@email.com
   DEHASHED_API_KEY=your_api_key
   ```

#### IntelX (FREE/PREMIUM)
1. Register at https://intelx.io
2. Get free API key (limited searches)
3. Add to `.env`:
   ```
   INTELX_API_KEY=your_key_here
   ```

### Step 2: Install Additional Dependencies

For web scraping (optional):
```bash
cd server
npm install puppeteer axios cheerio
```

### Step 3: Configure Scraper (Optional)

For people search sites without APIs:
```env
SCRAPER_API_KEY=your_key  # Get from scraperapi.com
```

## 📈 What Gets Checked

### Real-Time Checks
✅ Phone number format validation  
✅ Carrier lookup  
✅ Line type (mobile/landline)  
✅ Geographic location  
✅ Breach database matches  
✅ Public record presence  
✅ People search site listings  

### Database Scans
✅ Known data breaches (2005-2026)  
✅ Social media leaks  
✅ Dark web dumps  
✅ Public government records  
✅ Genealogy databases  
✅ Marketing lists  

## 🔐 Legal & Ethical Considerations

### ✅ Allowed Uses
- Checking your OWN phone number
- Monitoring for identity theft
- Privacy protection
- Personal security audits

### ❌ Prohibited Uses
- Stalking or harassment
- Investigating others without consent
- Commercial data mining
- Building contact lists
- Telemarketing

## 📊 Understanding Results

### "Found in Data Leaks"
Your phone number was discovered in:
- A data breach from a company
- A public records database
- A people search website
- Social media platform leak

### "Not Found in Leaks"
Your number wasn't found in any checked databases. This could mean:
- Your number is truly private
- The databases haven't been updated
- Some APIs require paid access
- Your number is under a different format

## 🛡️ Removal Guide

If your number is found, here's how to request removal:

### People Search Sites
1. **Whitepages**: https://www.whitepages.com/opt_out
2. **Spokeo**: https://www.spokeo.com/optout
3. **Intelius**: https://www.intelius.com/opt-out
4. **BeenVerified**: https://www.beenverified.com/app/optout
5. **TruthFinder**: https://www.truthfinder.com/opt-out

### Family History Sites
1. **Ancestry**: Contact support for living people records
2. **MyHeritage**: Privacy settings in account
3. **FamilySearch**: Request removal via help center

### Breach Databases
- You can't remove from breach databases (they're historical records)
- Focus on removing from people search sites
- Change your phone number if severely compromised

## 🔄 Automated Monitoring

Set up continuous monitoring:

```javascript
// Example: Check weekly
const cron = require('node-cron');

cron.schedule('0 0 * * 0', async () => {
  const result = await checkPhoneDatabase(yourNumber);
  if (result.foundInLeaks) {
    sendAlert(result);
  }
});
```

## 📞 Support & API Issues

### Common Problems

**"API key invalid"**
- Check your .env file
- Restart the server after adding keys
- Verify API key is active

**"Rate limit exceeded"**
- Free tiers have limits
- Upgrade to paid plan
- Add caching to reduce calls

**"Timeout errors"**
- Increase timeout in .env
- Check internet connection
- API may be temporarily down

## 🎯 Next Steps

1. **Get API keys** for the services you want to use
2. **Update .env file** with your credentials
3. **Restart the server** to load new settings
4. **Run a test check** to verify integration
5. **Set up monitoring** for continuous protection

---

## 📚 Additional Resources

- [Have I Been Pwned Documentation](https://haveibeenpwned.com/API/v3)
- [DeHashed API Reference](https://dehashed.com/api)
- [IntelX Developer Guide](https://intelx.io/api)
- [FTC Guide on Data Brokers](https://www.ftc.gov/business-guidance/resources/data-brokers-know-your-customers)
- [Privacy Rights Clearinghouse](https://privacyrights.org/)

---

**Remember**: This tool is for checking YOUR OWN phone number only. Always respect privacy laws and terms of service when using data APIs.
