# SiyaBusa ERP - Sales & CRM Module Training

## Complete Training Guide for Sales Teams

---

## Training Overview

**Duration:** 4-5 hours  
**Prerequisites:** Getting Started Guide completed  
**Certification:** Sales Professional  
**Assessment:** 40 questions, 80% to pass

---

## Module 1: Customer Management (45 minutes)

### Learning Objectives
- Create and manage customer records
- Set up customer groups and pricing
- Manage customer contacts
- Configure credit terms

---

### 1.1 Understanding Customers in SiyaBusa

**Customer Types:**

| Type | Description | Example |
|:-----|:------------|:--------|
| **Cash** | No credit, pay immediately | Walk-in customers |
| **Account** | Has credit terms | Business accounts |
| **Wholesale** | Bulk pricing applies | Resellers |
| **Retail** | Standard pricing | End consumers |

### 1.2 Creating a Customer

**Step-by-Step:**

1. Navigate to **Sales** → **Customers**
2. Click **+ Add Customer**
3. Complete the tabs:

**Basic Information:**
| Field | Required | Description |
|:------|:---------|:------------|
| Customer Code | Auto/Manual | Unique identifier |
| Company Name | Yes | Business name |
| Trading As | No | Trading name if different |
| Customer Type | Yes | Cash/Account |
| Customer Group | Yes | For pricing/reporting |

**Contact Details:**
| Field | Description |
|:------|:------------|
| Primary Contact | Main contact person |
| Email | For invoices/statements |
| Phone | Primary phone |
| Mobile | Cell number |
| Website | Company website |

**Addresses:**
| Address Type | Purpose |
|:-------------|:--------|
| Billing | Invoice destination |
| Shipping | Delivery address |
| Physical | Physical location |

**Financial Tab:**
| Field | Description |
|:------|:------------|
| VAT Number | For tax invoices |
| Payment Terms | Net 30, COD, etc. |
| Credit Limit | Maximum outstanding |
| Price List | Assigned price list |
| Sales Rep | Assigned salesperson |

4. Click **Save**

### 1.3 Customer Groups

**Purpose:**
- Apply group pricing
- Generate group reports
- Automate marketing

**Creating Groups:**
1. Go to **Sales** → **Setup** → **Customer Groups**
2. Click **+ Add Group**
3. Configure:
   - Group Code: RETAIL, WHOLESALE
   - Group Name: Retail Customers
   - Price List: Retail Price List
   - Default Terms: Net 30

### 1.4 Contact Management

**Adding Contacts:**
1. Open customer record
2. Go to **Contacts** tab
3. Click **+ Add Contact**
4. Enter:
   - Full Name
   - Position/Title
   - Email & Phone
   - Role (Decision Maker, Buyer, etc.)
   - Primary Contact (Yes/No)

### 1.5 Credit Management

**Setting Credit Limits:**
1. Open customer
2. Go to **Financial** tab
3. Set:
   - Credit Limit: R100,000
   - Credit Hold: No/Yes
   - Over Limit Action: Warn/Block

**Credit Check:**
- System checks credit before order confirmation
- Alerts if over limit
- Blocks if configured

### 1.6 Practice Exercise

**Exercise 1: Create Customer**

Create a business customer:
- Name: ABC Electronics (Pty) Ltd
- Type: Account
- Group: Wholesale
- Payment Terms: Net 30
- Credit Limit: R250,000
- Add 2 contacts

---

## Module 2: Price Lists & Pricing (30 minutes)

### Learning Objectives
- Create and manage price lists
- Set up promotional pricing
- Configure quantity breaks
- Apply customer-specific pricing

---

### 2.1 Price List Structure

**Types:**
| Type | Description |
|:-----|:------------|
| **Standard** | Default selling prices |
| **Retail** | Retail customer prices |
| **Wholesale** | Discounted bulk prices |
| **Promotional** | Time-limited offers |

### 2.2 Creating a Price List

**Step-by-Step:**

1. Go to **Sales** → **Price Lists**
2. Click **+ New Price List**
3. Configure:

| Field | Example |
|:------|:--------|
| Code | WHOLESALE |
| Name | Wholesale Price List |
| Currency | ZAR |
| Valid From | 01/01/2026 |
| Valid To | 31/12/2026 |
| Active | Yes |

4. Add pricing rules:

**Option 1: Fixed Prices**
| Item | Standard | This List |
|:-----|:---------|:----------|
| Laptop XPS | R32,500 | R28,500 |

**Option 2: Percentage Discount**
- All items: 15% off standard
- Category: 20% off standard

5. Click **Save**

### 2.3 Quantity Breaks

**Setup:**
1. Edit price list
2. Select item
3. Add quantity breaks:

| From Qty | To Qty | Price |
|:---------|:-------|:------|
| 1 | 9 | R500 |
| 10 | 49 | R450 |
| 50 | 99 | R400 |
| 100 | ∞ | R350 |

### 2.4 Promotional Pricing

**Creating Promotions:**
1. Go to **Sales** → **Promotions**
2. Click **+ New Promotion**
3. Configure:
   - Name: January Sale
   - Start Date: 01/01/2026
   - End Date: 31/01/2026
   - Discount: 25% off selected items
4. Add items to promotion
5. Activate

### 2.5 Price Hierarchy

**System Priority:**
1. Customer-specific price
2. Active promotion
3. Price list assigned to customer
4. Standard price list

---

## Module 3: Quotations (45 minutes)

### Learning Objectives
- Create professional quotations
- Use quote templates
- Follow up on quotes
- Convert quotes to orders

---

### 3.1 Quote Lifecycle

```
Draft → Sent → Under Review → Accepted → Converted to Order
                    ↓
                Rejected/Expired
```

### 3.2 Creating a Quotation

**Step-by-Step:**

1. Go to **Sales** → **Quotations**
2. Click **+ New Quote**
3. Complete header:

| Field | Description |
|:------|:------------|
| Customer | Select customer |
| Contact | Customer contact |
| Quote Date | Today |
| Valid Until | Expiry date |
| Reference | Customer's reference |
| Sales Rep | Assigned rep |

4. Add line items:

| Product | Qty | Unit Price | Discount | Line Total |
|:--------|:----|:-----------|:---------|:-----------|
| Laptop XPS | 5 | R32,500 | 5% | R154,375 |
| Keyboard | 5 | R200 | 0% | R1,000 |

5. Review totals:
   - Subtotal
   - Discount
   - VAT (15%)
   - **Grand Total**

6. Click **Save as Draft**

### 3.3 Quote Templates

**Using Templates:**
1. In quote, click **Load Template**
2. Select template
3. Items auto-populate
4. Adjust as needed

**Creating Templates:**
1. Create quote with common items
2. Click **Save as Template**
3. Name the template

### 3.4 Sending Quotes

**Email Quote:**
1. Open quote
2. Click **Send**
3. Choose: Email / Download PDF
4. Customize message
5. Send

**Quote PDF Includes:**
- Company header/logo
- Quote number and date
- Customer details
- Line items with images
- Terms and conditions
- Validity period

### 3.5 Quote Follow-Up

**Tracking Quotes:**
1. Go to **Sales** → **Quotations**
2. Filter by status: Sent
3. Sort by Valid Until (oldest first)
4. Click quote to view

**Follow-Up Actions:**
- Log a call
- Send reminder email
- Update status
- Add notes

### 3.6 Converting to Order

**When Customer Accepts:**
1. Open quote
2. Click **Convert to Order**
3. Review order details
4. Confirm
5. Quote status → Accepted
6. Sales order created

### 3.7 Practice Exercise

**Exercise 2: Create and Send Quote**

1. Create a quote for ABC Electronics
2. Add 5 Laptops and 5 Keyboards
3. Apply 5% discount
4. Send to customer email
5. Log a follow-up call

---

## Module 4: Sales Orders (45 minutes)

### Learning Objectives
- Create and manage sales orders
- Process order fulfillment
- Handle partial shipments
- Cancel and modify orders

---

### 4.1 Sales Order Lifecycle

```
Draft → Confirmed → Processing → Shipped → Delivered → Invoiced
                         ↓
                   On Hold / Cancelled
```

### 4.2 Creating a Sales Order

**Method 1: Direct Order**

1. Go to **Sales** → **Sales Orders**
2. Click **+ New Order**
3. Complete:

| Field | Description |
|:------|:------------|
| Customer | Select customer |
| Order Date | Today |
| Required Date | Expected delivery |
| Shipping Method | Courier/Collection |
| Payment Terms | From customer or override |

4. Add items (similar to quote)
5. Click **Save**
6. Click **Confirm Order**

**Method 2: From Quote**
- Quote automatically creates order when converted

### 4.3 Order Processing

**Check Stock:**
1. Open order
2. View line status:

| Item | Ordered | Available | Allocated |
|:-----|:--------|:----------|:----------|
| Laptop XPS | 5 | 8 | 5 |
| Keyboard | 5 | 3 | 3 |

3. If short, system shows backorder warning

**Allocate Stock:**
1. Click **Allocate**
2. System reserves stock
3. Items move to "Allocated" status

### 4.4 Order Fulfillment

**Creating Delivery:**
1. Open confirmed order
2. Click **Create Delivery**
3. Select items to ship:

| Item | Ordered | Ship Now | Backorder |
|:-----|:--------|:---------|:----------|
| Laptop XPS | 5 | 5 | 0 |
| Keyboard | 5 | 3 | 2 |

4. Enter shipping details:
   - Courier
   - Tracking number
   - Delivery address

5. Click **Ship**

**Partial Shipments:**
- Ship available items first
- Backorder created for remaining
- Customer notified

### 4.5 Order Holds

**Reasons for Hold:**
- Payment issue
- Credit limit exceeded
- Stock allocation problem
- Customer request

**Placing on Hold:**
1. Open order
2. Click **Hold Order**
3. Select reason
4. Add notes
5. Confirm

**Releasing Hold:**
1. Resolve issue
2. Click **Release Hold**
3. Order resumes processing

### 4.6 Order Modifications

**Before Shipment:**
- Add/remove items
- Change quantities
- Adjust prices
- Change delivery address

**After Partial Shipment:**
- Can only modify unshipped items
- May need to create return for shipped items

### 4.7 Practice Exercise

**Exercise 3: Process Sales Order**

1. Create order from the quote (Exercise 2)
2. Confirm the order
3. Allocate stock
4. Create partial delivery (only laptops available)
5. Print delivery note

---

## Module 5: Invoicing & Payments (45 minutes)

### Learning Objectives
- Generate customer invoices
- Process customer payments
- Handle credit notes
- Manage customer statements

---

### 5.1 Invoice Types

| Type | Description | From |
|:-----|:------------|:-----|
| **Sales Invoice** | Standard invoice | Delivery |
| **Proforma** | Pre-payment invoice | Order |
| **Tax Invoice** | VAT compliant | Delivery |
| **Credit Note** | Returns/adjustments | Invoice |

### 5.2 Creating Invoices

**From Delivery:**
1. Go to **Sales** → **Deliveries**
2. Select delivered items
3. Click **Create Invoice**
4. Review invoice
5. Click **Post**

**Batch Invoicing:**
1. Go to **Sales** → **Invoicing**
2. Click **Create Batch**
3. Select:
   - Date range
   - Customers
   - Uninvoiced deliveries
4. Click **Generate Invoices**

### 5.3 Invoice Details

**Invoice Includes:**
- Invoice number (auto-generated)
- Tax invoice date
- Customer details + VAT number
- Line items with VAT breakdown
- Payment terms
- Banking details
- Total due

### 5.4 Sending Invoices

**Options:**
- Email directly from system
- Download PDF
- Print and post
- Batch email

### 5.5 Receiving Payments

**Recording Payment:**
1. Go to **Sales** → **Receive Payment**
2. Select customer
3. Outstanding invoices display:

| Invoice | Date | Amount | Due Date |
|:--------|:-----|:-------|:---------|
| INV-001 | 01/01 | R155,375 | 31/01 |
| INV-002 | 05/01 | R25,000 | 04/02 |

4. Enter payment details:
   - Amount received
   - Payment date
   - Payment method (EFT, Card, Cash)
   - Reference (bank ref)

5. Allocate to invoices
6. Click **Save Payment**

### 5.6 Credit Notes

**Creating Credit Note:**
1. Go to **Sales** → **Credit Notes**
2. Click **+ New Credit Note**
3. Select original invoice
4. Choose reason:
   - Return
   - Pricing error
   - Damaged goods
   - Service issue
5. Enter items and amounts
6. Post credit note

**Allocation:**
- Apply to outstanding invoices
- Refund to customer
- Leave on account

### 5.7 Customer Statements

**Generating Statements:**
1. Go to **Sales** → **Statements**
2. Select:
   - Customer or All
   - Statement date
   - Include paid items
3. Click **Generate**

**Statement Shows:**
- Opening balance
- Transactions
- Payments
- Closing balance
- Aging breakdown

### 5.8 Practice Exercise

**Exercise 4: Invoicing**

1. Create invoice from delivery (Exercise 3)
2. Email invoice to customer
3. Record a payment of R100,000
4. Create credit note for R5,000 (damaged goods)
5. Generate customer statement

---

## Module 6: Sales Pipeline & Reporting (30 minutes)

### Learning Objectives
- Manage sales opportunities
- Track sales pipeline
- Generate sales reports
- Analyze sales performance

---

### 6.1 Opportunity Management

**Opportunity Stages:**
```
Lead → Qualification → Proposal → Negotiation → Closed Won/Lost
```

**Creating Opportunity:**
1. Go to **Sales** → **Opportunities**
2. Click **+ New Opportunity**
3. Enter:

| Field | Description |
|:------|:------------|
| Customer | Prospect company |
| Contact | Decision maker |
| Title | Deal name |
| Value | Expected amount |
| Stage | Current stage |
| Close Date | Expected close |
| Probability | Win likelihood % |
| Sales Rep | Owner |

4. Save

### 6.2 Pipeline Management

**Pipeline View:**
1. Go to **Sales** → **Pipeline**
2. View opportunities by stage (Kanban)
3. Drag to move stages
4. Click to see details

**Pipeline Value:**
| Stage | Count | Value | Weighted |
|:------|:------|:------|:---------|
| Lead | 10 | R500K | R50K |
| Qualification | 8 | R400K | R100K |
| Proposal | 5 | R300K | R150K |
| Negotiation | 3 | R200K | R140K |

### 6.3 Sales Reports

**Key Reports:**

| Report | Shows |
|:-------|:------|
| **Sales by Customer** | Revenue per customer |
| **Sales by Product** | Best selling items |
| **Sales by Rep** | Rep performance |
| **Sales by Region** | Geographic analysis |
| **Sales Trend** | Monthly comparison |
| **Quote Conversion** | Quote to order rate |

### 6.4 Running Reports

**Sales by Customer:**
1. Go to **Reports** → **Sales** → **By Customer**
2. Select date range
3. Choose customers (all or specific)
4. Click **Generate**

**Report Shows:**
| Customer | Orders | Invoiced | Paid | Outstanding |
|:---------|:-------|:---------|:-----|:------------|
| ABC Electronics | 5 | R500,000 | R400,000 | R100,000 |

### 6.5 Sales Dashboard

**Dashboard Widgets:**
- Monthly sales vs target
- Top 10 customers
- Pipeline value
- Overdue invoices
- Quote conversion rate
- Sales by rep

### 6.6 Practice Exercise

**Exercise 5: Pipeline & Reports**

1. Create a sales opportunity for R500,000
2. Move it through stages to "Proposal"
3. Run Sales by Customer report
4. View the sales pipeline

---

## Assessment Preparation

### Key Topics

1. Customer setup and credit management
2. Price lists and pricing strategies
3. Quote creation and conversion
4. Sales order processing
5. Invoicing and payments
6. Pipeline management

### Sample Questions

**Q1:** What happens when you convert a quote to order?
- A) Quote is deleted
- B) Quote status changes to Accepted and order is created ✓
- C) Customer is emailed
- D) Stock is allocated

**Q2:** Where do you set a customer's credit limit?
- A) Sales Order
- B) Customer record → Financial tab ✓
- C) Price List
- D) Invoice

---

## Quick Reference Card

### Common Tasks

| Task | Navigation |
|:-----|:-----------|
| New Customer | Sales → Customers → + Add |
| New Quote | Sales → Quotations → + New |
| New Order | Sales → Sales Orders → + New |
| Receive Payment | Sales → Receive Payment |
| Customer Statement | Sales → Statements |

### Status Meanings

| Status | Color | Meaning |
|:-------|:------|:--------|
| Draft | Gray | Not submitted |
| Confirmed | Blue | Approved/Active |
| Processing | Yellow | In progress |
| Complete | Green | Finished |
| On Hold | Orange | Paused |
| Cancelled | Red | Cancelled |

---

**Document:** Sales & CRM Module Training v1.0  
**Last Updated:** January 2026  
**Owner:** Masaphokati Technologies (Pty) Ltd
