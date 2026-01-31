# SiyaBusa ERP - Inventory Module Training

## Complete Training Guide for Inventory & Warehouse Teams

---

## Training Overview

**Duration:** 3-4 hours  
**Prerequisites:** Getting Started Guide completed  
**Certification:** Inventory Specialist  
**Assessment:** 35 questions, 80% to pass

---

## Module 1: Product Management (30 minutes)

### Learning Objectives
- Create and manage products
- Set up product categories
- Configure units of measure
- Manage product variants

---

### 1.1 Understanding Products in SiyaBusa

**Product Types:**

| Type | Description | Use Case |
|:-----|:------------|:---------|
| **Stock Item** | Physical goods you buy/sell | Raw materials, finished goods |
| **Non-Stock Item** | Items not tracked in inventory | Services, consumables |
| **Assembly** | Product made from components | Kits, bundles |
| **Service** | Labor or service items | Installation, consulting |

### 1.2 Creating a Product

**Step-by-Step:**

1. Navigate to **Inventory** → **Products**
2. Click **+ Add Product**
3. Complete the form:

**Basic Information Tab:**
| Field | Required | Description |
|:------|:---------|:------------|
| Product Code | Yes | Unique identifier (SKU) |
| Product Name | Yes | Display name |
| Product Type | Yes | Stock/Non-Stock/etc. |
| Category | Yes | For grouping |
| Description | No | Detailed description |
| Barcode | No | For scanning |

**Purchasing Tab:**
| Field | Description |
|:------|:------------|
| Preferred Supplier | Default supplier |
| Purchase Price | Cost price |
| Purchase UOM | Unit for buying |
| Lead Time | Days to receive |
| Minimum Order | Minimum quantity |

**Selling Tab:**
| Field | Description |
|:------|:------------|
| Selling Price | Standard price |
| Selling UOM | Unit for selling |
| Tax Code | VAT treatment |
| Sales Account | Revenue account |

**Inventory Tab:**
| Field | Description |
|:------|:------------|
| Track Inventory | Yes/No |
| Reorder Level | When to reorder |
| Reorder Quantity | How much to order |
| Default Warehouse | Primary storage |

4. Click **Save**

### 1.3 Product Categories

**Setting Up Categories:**
1. Go to **Inventory** → **Setup** → **Categories**
2. Click **+ Add Category**
3. Enter:
   - Category Code
   - Category Name
   - Parent Category (for hierarchy)
4. Click **Save**

**Example Hierarchy:**
```
Electronics
├── Computers
│   ├── Laptops
│   └── Desktops
├── Accessories
│   ├── Keyboards
│   └── Mice
└── Cables
```

### 1.4 Units of Measure

**Creating UOMs:**
1. Go to **Inventory** → **Setup** → **Units of Measure**
2. Click **+ Add**
3. Configure:
   - Code: EA, BOX, KG, LTR
   - Name: Each, Box, Kilogram, Litre
   - Conversion factor (if needed)

**Conversion Example:**
```
1 BOX = 12 EA
1 PALLET = 48 BOX = 576 EA
```

### 1.5 Practice Exercise

**Exercise 1: Create Products**

Create the following products:
1. Laptop Dell XPS 15
   - SKU: DELL-XPS15
   - Category: Electronics > Computers > Laptops
   - Purchase Price: R25,000
   - Selling Price: R32,500
   - Reorder Level: 5

---

## Module 2: Warehouse Management (30 minutes)

### Learning Objectives
- Set up warehouses and locations
- Configure bin locations
- Manage multi-warehouse operations
- Understand location hierarchies

---

### 2.1 Warehouse Structure

```
Company
└── Warehouse (e.g., Johannesburg DC)
    └── Zone (e.g., Zone A - Electronics)
        └── Aisle (e.g., Aisle 01)
            └── Shelf (e.g., Shelf A)
                └── Bin (e.g., BIN-001)
```

### 2.2 Creating a Warehouse

**Step-by-Step:**

1. Go to **Inventory** → **Warehouses**
2. Click **+ Add Warehouse**
3. Complete:

| Field | Description |
|:------|:------------|
| Warehouse Code | JHB-DC |
| Warehouse Name | Johannesburg Distribution Centre |
| Address | Physical address |
| Contact | Warehouse manager |
| Default | Is this the primary warehouse? |

4. Click **Save**

### 2.3 Creating Locations/Bins

**Step-by-Step:**

1. Select warehouse
2. Go to **Locations** tab
3. Click **+ Add Location**
4. Configure:

| Field | Example |
|:------|:--------|
| Location Code | A-01-01-001 |
| Location Name | Aisle A, Shelf 1, Bin 1 |
| Zone | Zone A |
| Type | Storage/Receiving/Shipping |
| Capacity | Maximum units |

**Bulk Create Locations:**
1. Click **Generate Locations**
2. Set patterns:
   - Aisles: A-F
   - Shelves: 01-10
   - Bins: 001-050
3. Click **Generate**

### 2.4 Location Types

| Type | Purpose |
|:-----|:--------|
| **Storage** | Regular inventory storage |
| **Receiving** | Goods receipt staging |
| **Shipping** | Dispatch staging |
| **Quality** | Inspection hold area |
| **Returns** | Customer returns |
| **Damaged** | Damaged goods |

### 2.5 Practice Exercise

**Exercise 2: Set Up Warehouse**

1. Create a warehouse: Cape Town Distribution
2. Add 3 zones: Electronics, General, Cold Storage
3. Generate bin locations for Electronics zone

---

## Module 3: Stock Movements (45 minutes)

### Learning Objectives
- Receive goods into inventory
- Issue goods from inventory
- Transfer between warehouses
- Adjust stock levels

---

### 3.1 Types of Stock Movements

| Movement | Effect | Trigger |
|:---------|:-------|:--------|
| **Goods Receipt** | Increases stock | Purchase order |
| **Goods Issue** | Decreases stock | Sales order |
| **Transfer** | Moves between locations | Transfer order |
| **Adjustment** | Corrects quantity | Stock count |
| **Write-off** | Removes damaged stock | Damage report |

### 3.2 Receiving Goods (Goods Receipt)

**From Purchase Order:**

1. Go to **Inventory** → **Goods Receipts**
2. Click **+ New Receipt**
3. Select **From Purchase Order**
4. Choose the PO
5. Verify quantities received:

| Item | Ordered | Received | Variance |
|:-----|:--------|:---------|:---------|
| Laptop XPS | 10 | 10 | 0 |
| Keyboard | 20 | 18 | -2 |

6. Select storage location
7. Click **Receive**

**Direct Receipt (No PO):**
1. Click **Direct Receipt**
2. Select supplier
3. Add items manually
4. Complete receipt

### 3.3 Issuing Goods (Goods Issue)

**From Sales Order:**

1. Go to **Inventory** → **Goods Issues**
2. Click **+ New Issue**
3. Select **From Sales Order**
4. Choose the SO
5. Confirm quantities and locations
6. Click **Issue**

**Pick List Generation:**
1. Select multiple orders
2. Click **Generate Pick List**
3. Print pick list
4. Complete picking
5. Confirm issue

### 3.4 Stock Transfers

**Between Warehouses:**

1. Go to **Inventory** → **Transfers**
2. Click **+ New Transfer**
3. Configure:

| Field | Selection |
|:------|:----------|
| From Warehouse | Johannesburg DC |
| To Warehouse | Cape Town DC |
| Transfer Date | Today |

4. Add items:

| Item | Quantity | From Bin | To Bin |
|:-----|:---------|:---------|:-------|
| Laptop XPS | 5 | A-01-001 | B-01-001 |

5. Click **Create Transfer**
6. Status: **In Transit**
7. At destination, click **Receive Transfer**

### 3.5 Stock Adjustments

**When to Adjust:**
- Physical count differences
- System errors
- Damage discovered
- Theft

**Step-by-Step:**

1. Go to **Inventory** → **Adjustments**
2. Click **+ New Adjustment**
3. Select reason:
   - Stock Count Variance
   - Damage
   - Theft
   - System Correction
4. Add items and quantities (+/-)
5. Add notes/documentation
6. Submit for approval
7. Once approved, adjustment posts

### 3.6 Practice Exercise

**Exercise 3: Stock Movements**

1. Receive 10 units of Laptop XPS into Johannesburg DC
2. Transfer 3 units to Cape Town DC
3. Create an adjustment for 1 damaged unit

---

## Module 4: Stock Takes (30 minutes)

### Learning Objectives
- Plan and execute stock counts
- Handle count variances
- Complete stock take reconciliation
- Generate count reports

---

### 4.1 Types of Stock Takes

| Type | Scope | Frequency |
|:-----|:------|:----------|
| **Full Count** | All inventory | Annually |
| **Cycle Count** | Portion of inventory | Weekly/Monthly |
| **Spot Check** | Random items | As needed |
| **Perpetual** | Triggered by movement | Continuous |

### 4.2 Planning a Stock Take

**Step-by-Step:**

1. Go to **Inventory** → **Stock Takes**
2. Click **+ New Stock Take**
3. Configure:

| Field | Description |
|:------|:------------|
| Type | Full/Cycle/Spot |
| Warehouse | Select warehouse |
| Date | Scheduled date |
| Categories | Filter by category |
| Locations | Filter by location |
| Count Team | Assigned counters |

4. Click **Create**
5. Status: **Planned**

### 4.3 Generating Count Sheets

1. Open the stock take
2. Click **Generate Count Sheets**
3. Options:
   - Sort by location or product
   - Include/exclude expected quantities
   - Print barcodes
4. Print or download sheets
5. Distribute to count team

### 4.4 Conducting the Count

**Best Practices:**
- Count during low activity periods
- Use two-person teams (one counts, one records)
- Count by location, not by product
- Mark completed areas
- Don't move stock during count

### 4.5 Entering Count Results

**Option 1: Manual Entry**
1. Open stock take
2. Click **Enter Counts**
3. Enter quantities for each item
4. Save progress

**Option 2: Barcode Scanning**
1. Use mobile device
2. Scan item barcode
3. Enter quantity
4. Scan next item
5. Upload when complete

### 4.6 Variance Analysis

After counts are entered:

1. Click **Analyze Variances**
2. Review discrepancies:

| Item | System Qty | Counted | Variance | Value |
|:-----|:-----------|:--------|:---------|:------|
| Laptop XPS | 45 | 44 | -1 | -R25,000 |
| Keyboard | 120 | 122 | +2 | +R400 |

3. Investigate significant variances
4. Recount if needed

### 4.7 Completing Stock Take

1. Review all variances
2. Add notes for discrepancies
3. Get approval (if required)
4. Click **Post Adjustments**
5. System creates adjustment entries
6. Stock take closed

### 4.8 Practice Exercise

**Exercise 4: Conduct Stock Take**

1. Create a cycle count for the Electronics category
2. Generate count sheets
3. Enter count results (simulate some variances)
4. Analyze and explain variances
5. Post adjustments

---

## Module 5: Inventory Reports (30 minutes)

### Learning Objectives
- Run standard inventory reports
- Analyze stock levels
- Monitor slow-moving items
- Track inventory value

---

### 5.1 Key Inventory Reports

| Report | Purpose | Frequency |
|:-------|:--------|:----------|
| **Stock on Hand** | Current quantities | Daily |
| **Stock Valuation** | Inventory value | Monthly |
| **Stock Movement** | All movements for period | Weekly |
| **Reorder Report** | Items below reorder level | Daily |
| **Slow Moving** | Items not selling | Monthly |
| **Dead Stock** | Zero movement items | Quarterly |
| **Stock Aging** | Age analysis | Monthly |

### 5.2 Stock on Hand Report

**What it Shows:**
- Product code and name
- Quantity per warehouse
- Quantity per location (bin level)
- Available vs committed

**Running the Report:**
1. Go to **Reports** → **Inventory** → **Stock on Hand**
2. Select parameters:
   - As at date
   - Warehouse (all or specific)
   - Category filter
   - Show zero quantities
3. Click **Generate**

### 5.3 Stock Valuation Report

**Valuation Methods:**

| Method | Description |
|:-------|:------------|
| **FIFO** | First In, First Out |
| **Weighted Average** | Average cost |
| **Standard Cost** | Predetermined cost |

**Report Shows:**
- Product
- Quantity on hand
- Unit cost
- Total value

### 5.4 Reorder Report

**Configuration:**
1. Products must have reorder levels set
2. Go to **Reports** → **Inventory** → **Reorder Report**
3. Shows all items at or below reorder level
4. Click **Create Purchase Orders** to auto-generate POs

### 5.5 Practice Exercise

**Exercise 5: Inventory Reports**

1. Run a Stock on Hand report for all warehouses
2. Generate a Stock Valuation report
3. Run the Reorder Report and identify items to order

---

## Module 6: Advanced Features (30 minutes)

### Learning Objectives
- Configure serial/batch tracking
- Set up expiry date tracking
- Manage product variants
- Use barcode scanning

---

### 6.1 Serial Number Tracking

**When to Use:**
- High-value items
- Warranty tracking
- Regulatory requirements

**Setup:**
1. Edit product
2. Enable **Track by Serial Number**
3. Choose serialization:
   - On Receipt
   - On Issue
   - Both

**During Receipt:**
1. Enter or scan serial numbers
2. One serial per unit
3. Serials must be unique

### 6.2 Batch/Lot Tracking

**When to Use:**
- Manufacturing batches
- Expiry dates
- Recall management

**Setup:**
1. Edit product
2. Enable **Track by Batch**
3. Configure batch properties

**During Receipt:**
1. Enter batch number
2. Enter batch quantity
3. Add expiry date if applicable

### 6.3 Expiry Date Management

**Configuration:**
1. Enable batch tracking
2. Set **Track Expiry Dates**
3. Configure alert thresholds:
   - Warning: 30 days before
   - Critical: 7 days before

**Reports:**
- Expiring Stock Report
- Expired Stock Report
- FEFO (First Expiry First Out) pick list

### 6.4 Product Variants

**Use Case:**
T-Shirts come in Size (S/M/L/XL) and Color (Red/Blue/Black)

**Setup:**
1. Create variant attributes:
   - Size: S, M, L, XL
   - Color: Red, Blue, Black
2. Create base product
3. Enable variants
4. Assign attributes
5. System generates variant matrix:

| Variant | SKU |
|:--------|:----|
| T-Shirt-S-Red | TS-S-R |
| T-Shirt-S-Blue | TS-S-B |
| T-Shirt-M-Red | TS-M-R |
| ... | ... |

### 6.5 Barcode Scanning

**Supported:**
- USB barcode scanners
- Mobile device cameras
- Bluetooth scanners

**Functions:**
- Add to stock
- Issue from stock
- Stock count
- Transfer
- Lookup product

---

## Assessment Preparation

### Key Topics

1. Product setup and types
2. Warehouse structure
3. Stock movements (receipt, issue, transfer)
4. Stock takes and adjustments
5. Inventory reports
6. Serial/batch tracking

### Sample Questions

**Q1:** What happens to inventory when you post a Goods Receipt?
- A) Decreases
- B) Increases ✓
- C) No change
- D) Transfers

**Q2:** What is the purpose of a reorder level?
- A) Maximum stock allowed
- B) Point to trigger new order ✓
- C) Minimum selling price
- D) Warehouse capacity

---

## Quick Reference Card

### Common Navigation

| Task | Path |
|:-----|:-----|
| New Product | Inventory → Products → + Add |
| Goods Receipt | Inventory → Goods Receipts → + New |
| Stock Transfer | Inventory → Transfers → + New |
| Stock Take | Inventory → Stock Takes → + New |
| Stock on Hand | Reports → Inventory → Stock on Hand |

### Keyboard Shortcuts

| Shortcut | Action |
|:---------|:-------|
| `Ctrl + /` | Search products |
| `F1` | Scan barcode |
| `Ctrl + R` | Quick receipt |
| `Ctrl + I` | Quick issue |

---

**Document:** Inventory Module Training v1.0  
**Last Updated:** January 2026  
**Owner:** Masaphokati Technologies (Pty) Ltd
