import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
  {
    name: 'Gmail → Google Sheets',
    description: 'Extract email data from Gmail and save to a Google Sheets spreadsheet automatically',
    category: 'Data Transfer',
    icon: '📧',
    workflow: {
      startUrl: 'https://mail.google.com',
      steps: [
        { step_id: 1, action: 'navigate', target_url: 'https://mail.google.com', description: 'Open Gmail inbox', timeout_ms: 10000, retry_count: 2 },
        { step_id: 2, action: 'click', target_type: 'text', target_value: 'Inbox', description: 'Navigate to inbox', timeout_ms: 5000, retry_count: 2 },
        { step_id: 3, action: 'click', target_type: 'aria', target_value: 'first email in list', description: 'Open first email', timeout_ms: 5000, retry_count: 2 },
        { step_id: 4, action: 'extract', target_type: 'css', target_value: '.bog', variable_name: 'email_subject', description: 'Extract email subject', timeout_ms: 5000, retry_count: 2 },
        { step_id: 5, action: 'extract', target_type: 'css', target_value: '.gD', variable_name: 'sender_email', description: 'Extract sender email', timeout_ms: 5000, retry_count: 2 },
        { step_id: 6, action: 'navigate', target_url: 'https://sheets.google.com', description: 'Open Google Sheets', timeout_ms: 10000, retry_count: 2 },
        { step_id: 7, action: 'click', target_type: 'aria', target_value: 'empty cell A1', description: 'Click cell A1', timeout_ms: 5000, retry_count: 2 },
        { step_id: 8, action: 'type', target_type: 'aria', target_value: 'formula bar', input_value: '{{email_subject}}', description: 'Type email subject', timeout_ms: 5000, retry_count: 2 },
      ]
    }
  },
  {
    name: 'LinkedIn Lead Scraper',
    description: 'Collect LinkedIn profiles matching specific search criteria and export to CSV',
    category: 'Scraping',
    icon: '🔗',
    workflow: {
      startUrl: 'https://www.linkedin.com/search/results/people/',
      steps: [
        { step_id: 1, action: 'navigate', target_url: 'https://www.linkedin.com/search/results/people/?keywords={{search_query}}', description: 'Search LinkedIn people', timeout_ms: 10000, retry_count: 2 },
        { step_id: 2, action: 'extract', target_type: 'css', target_value: '.entity-result__title-text', variable_name: 'lead_names', description: 'Extract lead names', timeout_ms: 5000, retry_count: 2 },
        { step_id: 3, action: 'extract', target_type: 'css', target_value: '.entity-result__primary-subtitle', variable_name: 'lead_titles', description: 'Extract job titles', timeout_ms: 5000, retry_count: 2 },
        { step_id: 4, action: 'scroll', description: 'Scroll for more results', timeout_ms: 3000, retry_count: 1 },
        { step_id: 5, action: 'wait', description: 'Wait for results to load', timeout_ms: 2000, retry_count: 1 },
      ]
    }
  },
  {
    name: 'Daily Price Monitor',
    description: 'Track product prices on e-commerce sites and alert when price drops below threshold',
    category: 'Monitoring',
    icon: '💰',
    workflow: {
      startUrl: '{{product_url}}',
      steps: [
        { step_id: 1, action: 'navigate', target_url: '{{product_url}}', description: 'Open product page', timeout_ms: 10000, retry_count: 3 },
        { step_id: 2, action: 'extract', target_type: 'css', target_value: '.price', variable_name: 'current_price', description: 'Extract current price', timeout_ms: 5000, retry_count: 2 },
        { step_id: 3, action: 'screenshot', description: 'Screenshot price evidence', timeout_ms: 3000, retry_count: 1 },
        { step_id: 4, action: 'extract', target_type: 'text', target_value: 'In Stock', variable_name: 'stock_status', description: 'Check stock status', timeout_ms: 5000, retry_count: 2 },
      ]
    }
  },
  {
    name: 'Invoice Data Extractor',
    description: 'Extract invoice amounts, dates, and vendor info from web invoices into a spreadsheet',
    category: 'Data Transfer',
    icon: '🧾',
    workflow: {
      startUrl: '{{invoice_url}}',
      steps: [
        { step_id: 1, action: 'navigate', target_url: '{{invoice_url}}', description: 'Open invoice page', timeout_ms: 10000, retry_count: 2 },
        { step_id: 2, action: 'extract', target_type: 'text_relative', target_value: 'Invoice Number', variable_name: 'invoice_number', description: 'Extract invoice number', timeout_ms: 5000, retry_count: 2 },
        { step_id: 3, action: 'extract', target_type: 'text_relative', target_value: 'Total', variable_name: 'invoice_total', description: 'Extract total amount', timeout_ms: 5000, retry_count: 2 },
        { step_id: 4, action: 'extract', target_type: 'text_relative', target_value: 'Due Date', variable_name: 'due_date', description: 'Extract due date', timeout_ms: 5000, retry_count: 2 },
        { step_id: 5, action: 'extract', target_type: 'text_relative', target_value: 'Vendor', variable_name: 'vendor_name', description: 'Extract vendor name', timeout_ms: 5000, retry_count: 2 },
      ]
    }
  },
  {
    name: 'Job Listings Aggregator',
    description: 'Collect job listings matching your criteria from multiple job boards',
    category: 'Scraping',
    icon: '💼',
    workflow: {
      startUrl: 'https://www.linkedin.com/jobs/search/',
      steps: [
        { step_id: 1, action: 'navigate', target_url: 'https://www.linkedin.com/jobs/search/?keywords={{job_title}}&location={{location}}', description: 'Search LinkedIn jobs', timeout_ms: 10000, retry_count: 2 },
        { step_id: 2, action: 'extract', target_type: 'css', target_value: '.job-card-list__title', variable_name: 'job_titles', description: 'Extract job titles', timeout_ms: 5000, retry_count: 2 },
        { step_id: 3, action: 'extract', target_type: 'css', target_value: '.job-card-container__company-name', variable_name: 'company_names', description: 'Extract company names', timeout_ms: 5000, retry_count: 2 },
        { step_id: 4, action: 'extract', target_type: 'css', target_value: '.job-card-container__metadata-item', variable_name: 'locations', description: 'Extract job locations', timeout_ms: 5000, retry_count: 2 },
        { step_id: 5, action: 'scroll', description: 'Scroll to load more jobs', timeout_ms: 2000, retry_count: 1 },
      ]
    }
  },
  {
    name: 'News Digest Compiler',
    description: 'Collect and summarize top news articles from major news sites daily',
    category: 'Scraping',
    icon: '📰',
    workflow: {
      startUrl: 'https://news.ycombinator.com',
      steps: [
        { step_id: 1, action: 'navigate', target_url: 'https://news.ycombinator.com', description: 'Open Hacker News', timeout_ms: 10000, retry_count: 2 },
        { step_id: 2, action: 'extract', target_type: 'css', target_value: '.titleline > a', variable_name: 'article_titles', description: 'Extract article titles', timeout_ms: 5000, retry_count: 2 },
        { step_id: 3, action: 'extract', target_type: 'css', target_value: '.score', variable_name: 'article_scores', description: 'Extract point scores', timeout_ms: 5000, retry_count: 2 },
        { step_id: 4, action: 'extract', target_type: 'css', target_value: '.subtext .hnuser', variable_name: 'submitters', description: 'Extract submitter names', timeout_ms: 5000, retry_count: 2 },
      ]
    }
  },
  {
    name: 'Competitor Price Tracker',
    description: 'Monitor competitor website prices and compare with your own pricing automatically',
    category: 'Monitoring',
    icon: '📊',
    workflow: {
      startUrl: '{{competitor_url}}',
      steps: [
        { step_id: 1, action: 'navigate', target_url: '{{competitor_url}}', description: 'Open competitor site', timeout_ms: 10000, retry_count: 3 },
        { step_id: 2, action: 'extract', target_type: 'css', target_value: '[class*="price"]', variable_name: 'competitor_price', description: 'Extract competitor price', timeout_ms: 5000, retry_count: 2 },
        { step_id: 3, action: 'extract', target_type: 'css', target_value: '[class*="product-name"], h1', variable_name: 'product_name', description: 'Extract product name', timeout_ms: 5000, retry_count: 2 },
        { step_id: 4, action: 'screenshot', description: 'Screenshot for evidence', timeout_ms: 3000, retry_count: 1 },
      ]
    }
  },
  {
    name: 'Form Auto-Filler',
    description: 'Automatically fill repetitive registration or application forms with your data',
    category: 'Forms',
    icon: '📝',
    workflow: {
      startUrl: '{{form_url}}',
      steps: [
        { step_id: 1, action: 'navigate', target_url: '{{form_url}}', description: 'Open form page', timeout_ms: 10000, retry_count: 2 },
        { step_id: 2, action: 'type', target_type: 'placeholder', target_value: 'First Name', input_value: '{{first_name}}', description: 'Fill first name', timeout_ms: 5000, retry_count: 2 },
        { step_id: 3, action: 'type', target_type: 'placeholder', target_value: 'Last Name', input_value: '{{last_name}}', description: 'Fill last name', timeout_ms: 5000, retry_count: 2 },
        { step_id: 4, action: 'type', target_type: 'placeholder', target_value: 'Email', input_value: '{{email}}', description: 'Fill email', timeout_ms: 5000, retry_count: 2 },
        { step_id: 5, action: 'type', target_type: 'placeholder', target_value: 'Phone', input_value: '{{phone}}', description: 'Fill phone number', timeout_ms: 5000, retry_count: 2 },
        { step_id: 6, action: 'click', target_type: 'text', target_value: 'Submit', description: 'Submit form', timeout_ms: 5000, retry_count: 2 },
      ]
    }
  },
  {
    name: 'Report Downloader',
    description: 'Auto-download scheduled reports from web portals and save to designated folder',
    category: 'Reporting',
    icon: '📥',
    workflow: {
      startUrl: '{{portal_url}}',
      steps: [
        { step_id: 1, action: 'navigate', target_url: '{{portal_url}}', description: 'Open portal', timeout_ms: 10000, retry_count: 2 },
        { step_id: 2, action: 'type', target_type: 'placeholder', target_value: 'Username', input_value: '{{username}}', description: 'Enter username', timeout_ms: 5000, retry_count: 2 },
        { step_id: 3, action: 'type', target_type: 'placeholder', target_value: 'Password', input_value: '{{password}}', description: 'Enter password', timeout_ms: 5000, retry_count: 2 },
        { step_id: 4, action: 'click', target_type: 'text', target_value: 'Login', description: 'Click login', timeout_ms: 5000, retry_count: 3 },
        { step_id: 5, action: 'click', target_type: 'text', target_value: 'Reports', description: 'Navigate to reports', timeout_ms: 5000, retry_count: 2 },
        { step_id: 6, action: 'click', target_type: 'text', target_value: 'Download', description: 'Download report', timeout_ms: 10000, retry_count: 2 },
      ]
    }
  },
  {
    name: 'Social Media Monitor',
    description: 'Monitor brand mentions and engagement metrics across social media platforms',
    category: 'Monitoring',
    icon: '📱',
    workflow: {
      startUrl: 'https://twitter.com/search',
      steps: [
        { step_id: 1, action: 'navigate', target_url: 'https://twitter.com/search?q={{brand_name}}&src=typed_query', description: 'Search Twitter for brand', timeout_ms: 10000, retry_count: 2 },
        { step_id: 2, action: 'extract', target_type: 'css', target_value: '[data-testid="tweetText"]', variable_name: 'tweet_texts', description: 'Extract tweet texts', timeout_ms: 5000, retry_count: 2 },
        { step_id: 3, action: 'scroll', description: 'Scroll for more tweets', timeout_ms: 2000, retry_count: 1 },
        { step_id: 4, action: 'extract', target_type: 'css', target_value: '[data-testid="like"]', variable_name: 'like_counts', description: 'Extract like counts', timeout_ms: 5000, retry_count: 2 },
      ]
    }
  },
  {
    name: 'E-commerce Order Processor',
    description: 'Automatically process incoming orders: verify, confirm, and update inventory system',
    category: 'Data Transfer',
    icon: '🛒',
    workflow: {
      startUrl: '{{admin_url}}',
      steps: [
        { step_id: 1, action: 'navigate', target_url: '{{admin_url}}/orders', description: 'Open orders dashboard', timeout_ms: 10000, retry_count: 2 },
        { step_id: 2, action: 'click', target_type: 'text', target_value: 'Pending', description: 'Filter pending orders', timeout_ms: 5000, retry_count: 2 },
        { step_id: 3, action: 'extract', target_type: 'css', target_value: '.order-id', variable_name: 'order_id', description: 'Extract order ID', timeout_ms: 5000, retry_count: 2 },
        { step_id: 4, action: 'extract', target_type: 'css', target_value: '.order-total', variable_name: 'order_total', description: 'Extract order total', timeout_ms: 5000, retry_count: 2 },
        { step_id: 5, action: 'click', target_type: 'text', target_value: 'Confirm Order', description: 'Confirm the order', timeout_ms: 5000, retry_count: 2 },
        { step_id: 6, action: 'screenshot', description: 'Screenshot confirmation', timeout_ms: 3000, retry_count: 1 },
      ]
    }
  },
  {
    name: 'CRM Data Sync',
    description: 'Sync contact and lead data between your CRM and internal systems automatically',
    category: 'Data Transfer',
    icon: '🔄',
    workflow: {
      startUrl: '{{crm_url}}',
      steps: [
        { step_id: 1, action: 'navigate', target_url: '{{crm_url}}/contacts', description: 'Open CRM contacts', timeout_ms: 10000, retry_count: 2 },
        { step_id: 2, action: 'click', target_type: 'text', target_value: 'Export', description: 'Click export button', timeout_ms: 5000, retry_count: 2 },
        { step_id: 3, action: 'click', target_type: 'text', target_value: 'CSV', description: 'Select CSV format', timeout_ms: 5000, retry_count: 2 },
        { step_id: 4, action: 'click', target_type: 'text', target_value: 'Download', description: 'Download export', timeout_ms: 10000, retry_count: 2 },
        { step_id: 5, action: 'navigate', target_url: '{{internal_url}}/import', description: 'Open internal import page', timeout_ms: 10000, retry_count: 2 },
        { step_id: 6, action: 'click', target_type: 'text', target_value: 'Upload File', description: 'Upload exported file', timeout_ms: 5000, retry_count: 2 },
      ]
    }
  },
];

async function seed() {
  console.log('Seeding templates...');

  const existing = await prisma.template.count();
  if (existing >= 12) {
    console.log(`Templates already seeded (${existing} found). Skipping.`);
    return;
  }

  for (const t of templates) {
    await prisma.template.upsert({
      where: { id: t.name } as any,
      update: {},
      create: t,
    });
  }

  console.log(`✅ Seeded ${templates.length} templates`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
