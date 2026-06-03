"""
Comprehensive Logistics ERP Demo Data Seed Script
This script seeds all Logistics ERP modules with realistic demo data
"""
from datetime import datetime, timedelta
import json
import random
from sqlalchemy.orm import Session
from app.utils.db import engine, SessionLocal
from app.models.models import (
    # Finance
    JournalEntry, Account,
    # Procurement
    Supplier, PurchaseRequisition, RFQ, PurchaseOrder, GoodsReceipt, SupplierInvoice,
    # HR
    Department, Employee, Candidate, LeaveRequest, AttendanceLog, PaySlip,
    # CRM
    Lead, Contact, CustomerAccount, Opportunity, Quote,
    # Inventory
    Product, Warehouse, StockTransaction,
    # E-Commerce
    StoreProduct, CustomerOrder, OrderItem, LoyaltyAccount,
    # Fixed Assets
    FixedAsset, DepreciationLog, MaintenanceOrder,
    # Manufacturing
    BillOfMaterials, BOMComponent, WorkCenter, ProductionOrder, OEELog
)

def generate_uuid():
    import uuid
    return str(uuid.uuid4())

def seed_finance_data(db: Session):
    """Seed Finance module with demo data"""
    print("Seeding Finance data...")
    
    # Create Chart of Accounts
    accounts = [
        {"code": "1000", "name": "Cash", "type": "ASSET", "balance": 500000.0},
        {"code": "1100", "name": "Accounts Receivable", "type": "ASSET", "balance": 250000.0},
        {"code": "1200", "name": "Inventory", "type": "ASSET", "balance": 750000.0},
        {"code": "1300", "name": "Fixed Assets", "type": "ASSET", "balance": 2000000.0},
        {"code": "2000", "name": "Accounts Payable", "type": "LIABILITY", "balance": 150000.0},
        {"code": "2100", "name": "Loans Payable", "type": "LIABILITY", "balance": 500000.0},
        {"code": "3000", "name": "Owner's Equity", "type": "EQUITY", "balance": 2850000.0},
        {"code": "4000", "name": "Sales Revenue", "type": "REVENUE", "balance": 0.0},
        {"code": "5000", "name": "Cost of Goods Sold", "type": "EXPENSE", "balance": 0.0},
        {"code": "5100", "name": "Operating Expenses", "type": "EXPENSE", "balance": 0.0},
    ]
    
    for acc_data in accounts:
        existing = db.query(Account).filter(Account.code == acc_data["code"]).first()
        if not existing:
            account = Account(**acc_data)
            db.add(account)
    
    # Create Journal Entries
    journal_entries = [
        {
            "blockIndex": 1,
            "voucherType": "JV",
            "voucherNo": "JV-001",
            "date": datetime(2024, 1, 1),
            "amount": 100000.0,
            "debitAcc": "Cash",
            "creditAcc": "Owner's Equity",
            "narration": "Initial capital investment",
            "prevHash": "0",
            "blockHash": "hash1"
        },
        {
            "blockIndex": 2,
            "voucherType": "PV",
            "voucherNo": "PV-001",
            "date": datetime(2024, 1, 15),
            "amount": 50000.0,
            "debitAcc": "Inventory",
            "creditAcc": "Cash",
            "narration": "Purchase of raw materials",
            "prevHash": "hash1",
            "blockHash": "hash2"
        },
        {
            "blockIndex": 3,
            "voucherType": "RV",
            "voucherNo": "RV-001",
            "date": datetime(2024, 1, 20),
            "amount": 75000.0,
            "debitAcc": "Cash",
            "creditAcc": "Sales Revenue",
            "narration": "Sales revenue from customer order",
            "prevHash": "hash2",
            "blockHash": "hash3"
        }
    ]
    
    for je_data in journal_entries:
        existing = db.query(JournalEntry).filter(JournalEntry.voucherNo == je_data["voucherNo"]).first()
        if not existing:
            journal_entry = JournalEntry(**je_data)
            db.add(journal_entry)
    
    db.commit()
    print("✅ Finance data seeded successfully")

def seed_procurement_data(db: Session):
    """Seed Procurement module with demo data"""
    print("Seeding Procurement data...")
    
    # Create Suppliers
    suppliers = [
        {
            "name": "TechSupply Corp",
            "email": "orders@techsupply.com",
            "phone": "+1-555-0101",
            "address": "123 Industrial Blvd, Tech City",
            "deliveryScore": 95.0,
            "qualityScore": 92.0,
            "priceScore": 88.0,
            "overallScore": 91.7
        },
        {
            "name": "Global Materials Inc",
            "email": "sales@globalmaterials.com",
            "phone": "+1-555-0102",
            "address": "456 Manufacturing Ave, Industrial Park",
            "deliveryScore": 88.0,
            "qualityScore": 95.0,
            "priceScore": 90.0,
            "overallScore": 91.0
        },
        {
            "name": "Prime Logistics Partners",
            "email": "contact@primelogistics.com",
            "phone": "+1-555-0103",
            "address": "789 Transport Road, Logistics Hub",
            "deliveryScore": 98.0,
            "qualityScore": 90.0,
            "priceScore": 85.0,
            "overallScore": 91.0
        }
    ]
    
    supplier_map = {}
    for sup_data in suppliers:
        existing = db.query(Supplier).filter(Supplier.email == sup_data["email"]).first()
        if not existing:
            supplier = Supplier(**sup_data)
            db.add(supplier)
            db.flush()
            supplier_map[sup_data["name"]] = supplier.id
        else:
            supplier_map[sup_data["name"]] = existing.id
    
    # Create Purchase Requisitions
    prs = [
        {
            "prNo": "PR-2024-001",
            "requestedBy": "John Smith",
            "department": "Operations",
            "status": "APPROVED",
            "items": json.dumps([
                {"item": "Raw Material A", "quantity": 500, "unit": "kg"},
                {"item": "Raw Material B", "quantity": 300, "unit": "kg"}
            ])
        },
        {
            "prNo": "PR-2024-002",
            "requestedBy": "Sarah Johnson",
            "department": "Manufacturing",
            "status": "APPROVED",
            "items": json.dumps([
                {"item": "Packaging Materials", "quantity": 1000, "unit": "units"}
            ])
        }
    ]
    
    pr_map = {}
    for pr_data in prs:
        existing = db.query(PurchaseRequisition).filter(PurchaseRequisition.prNo == pr_data["prNo"]).first()
        if not existing:
            pr = PurchaseRequisition(**pr_data)
            db.add(pr)
            db.flush()
            pr_map[pr_data["prNo"]] = pr.id
        else:
            pr_map[pr_data["prNo"]] = existing.id
    
    # Create RFQs
    rfqs = [
        {
            "rfqNo": "RFQ-2024-001",
            "purchaseRequisitionId": pr_map.get("PR-2024-001"),
            "status": "CLOSED",
            "items": json.dumps([
                {"item": "Raw Material A", "quantity": 500, "unit": "kg", "specs": "Grade A"},
                {"item": "Raw Material B", "quantity": 300, "unit": "kg", "specs": "Grade B"}
            ])
        }
    ]
    
    rfq_map = {}
    for rfq_data in rfqs:
        existing = db.query(RFQ).filter(RFQ.rfqNo == rfq_data["rfqNo"]).first()
        if not existing:
            rfq = RFQ(**rfq_data)
            db.add(rfq)
            db.flush()
            rfq_map[rfq_data["rfqNo"]] = rfq.id
        else:
            rfq_map[rfq_data["rfqNo"]] = existing.id
    
    # Create Purchase Orders
    pos = [
        {
            "poNo": "PO-2024-001",
            "supplierId": supplier_map["TechSupply Corp"],
            "rfqId": rfq_map.get("RFQ-2024-001"),
            "status": "COMPLETED",
            "items": json.dumps([
                {"item": "Raw Material A", "quantity": 500, "unit": "kg", "unitPrice": 25.00},
                {"item": "Raw Material B", "quantity": 300, "unit": "kg", "unitPrice": 30.00}
            ]),
            "totalAmount": 21500.00
        },
        {
            "poNo": "PO-2024-002",
            "supplierId": supplier_map["Global Materials Inc"],
            "status": "SHIPPED",
            "items": json.dumps([
                {"item": "Packaging Materials", "quantity": 1000, "unit": "units", "unitPrice": 5.00}
            ]),
            "totalAmount": 5000.00
        }
    ]
    
    po_map = {}
    for po_data in pos:
        existing = db.query(PurchaseOrder).filter(PurchaseOrder.poNo == po_data["poNo"]).first()
        if not existing:
            po = PurchaseOrder(**po_data)
            db.add(po)
            db.flush()
            po_map[po_data["poNo"]] = po.id
        else:
            po_map[po_data["poNo"]] = existing.id
    
    # Create Goods Receipts
    grs = [
        {
            "grnNo": "GRN-2024-001",
            "purchaseOrderId": po_map.get("PO-2024-001"),
            "supplierId": supplier_map["TechSupply Corp"],
            "receivedBy": "Mike Wilson",
            "receivedItems": json.dumps([
                {"item": "Raw Material A", "quantity": 495, "unit": "kg", "condition": "Good"},
                {"item": "Raw Material B", "quantity": 300, "unit": "kg", "condition": "Good"}
            ])
        }
    ]
    
    for gr_data in grs:
        existing = db.query(GoodsReceipt).filter(GoodsReceipt.grnNo == gr_data["grnNo"]).first()
        if not existing:
            gr = GoodsReceipt(**gr_data)
            db.add(gr)
    
    # Create Supplier Invoices
    invoices = [
        {
            "invoiceNo": "INV-2024-001",
            "purchaseOrderId": po_map.get("PO-2024-001"),
            "supplierId": supplier_map["TechSupply Corp"],
            "items": json.dumps([
                {"item": "Raw Material A", "quantity": 500, "unit": "kg", "unitPrice": 25.00},
                {"item": "Raw Material B", "quantity": 300, "unit": "kg", "unitPrice": 30.00}
            ]),
            "totalAmount": 21500.00,
            "taxAmount": 2150.00,
            "status": "PAID",
            "matchingLog": json.dumps({"status": "MATCH_PASSED", "discrepancies": []})
        }
    ]
    
    for inv_data in invoices:
        existing = db.query(SupplierInvoice).filter(SupplierInvoice.invoiceNo == inv_data["invoiceNo"]).first()
        if not existing:
            invoice = SupplierInvoice(**inv_data)
            db.add(invoice)
    
    db.commit()
    print("✅ Procurement data seeded successfully")

def seed_hr_data(db: Session):
    """Seed HR module with demo data"""
    print("Seeding HR data...")
    
    # Create Departments
    departments = [
        {"code": "OPS", "name": "Operations", "parentId": None},
        {"code": "FIN", "name": "Finance", "parentId": None},
        {"code": "HR", "name": "Human Resources", "parentId": None},
        {"code": "MFG", "name": "Manufacturing", "parentId": None},
        {"code": "LOG", "name": "Logistics", "parentId": None},
        {"code": "PROD", "name": "Production", "parentId": None}
    ]
    
    dept_map = {}
    for dept_data in departments:
        existing = db.query(Department).filter(Department.code == dept_data["code"]).first()
        if not existing:
            dept = Department(**dept_data)
            db.add(dept)
            db.flush()
            dept_map[dept_data["code"]] = dept.id
        else:
            dept_map[dept_data["code"]] = existing.id
    
    # Create Employees
    employees = [
        {
            "employeeCode": "EMP001",
            "firstName": "John",
            "lastName": "Smith",
            "email": "john.smith@company.com",
            "phone": "+1-555-1001",
            "departmentId": dept_map["OPS"],
            "jobTitle": "Operations Manager",
            "managerId": None,
            "baseSalary": 85000.0,
            "joiningDate": datetime(2020, 3, 15),
            "isActive": True
        },
        {
            "employeeCode": "EMP002",
            "firstName": "Sarah",
            "lastName": "Johnson",
            "email": "sarah.johnson@company.com",
            "phone": "+1-555-1002",
            "departmentId": dept_map["MFG"],
            "jobTitle": "Production Supervisor",
            "managerId": None,
            "baseSalary": 72000.0,
            "joiningDate": datetime(2021, 6, 1),
            "isActive": True
        },
        {
            "employeeCode": "EMP003",
            "firstName": "Mike",
            "lastName": "Wilson",
            "email": "mike.wilson@company.com",
            "phone": "+1-555-1003",
            "departmentId": dept_map["LOG"],
            "jobTitle": "Logistics Coordinator",
            "managerId": None,
            "baseSalary": 65000.0,
            "joiningDate": datetime(2022, 1, 10),
            "isActive": True
        },
        {
            "employeeCode": "EMP004",
            "firstName": "Emily",
            "lastName": "Davis",
            "email": "emily.davis@company.com",
            "phone": "+1-555-1004",
            "departmentId": dept_map["FIN"],
            "jobTitle": "Finance Analyst",
            "managerId": None,
            "baseSalary": 70000.0,
            "joiningDate": datetime(2021, 9, 20),
            "isActive": True
        },
        {
            "employeeCode": "EMP005",
            "firstName": "Robert",
            "lastName": "Chen",
            "email": "robert.chen@company.com",
            "phone": "+1-555-1005",
            "departmentId": dept_map["HR"],
            "jobTitle": "HR Specialist",
            "managerId": None,
            "baseSalary": 60000.0,
            "joiningDate": datetime(2023, 2, 14),
            "isActive": True
        }
    ]
    
    emp_map = {}
    for emp_data in employees:
        existing = db.query(Employee).filter(Employee.employeeCode == emp_data["employeeCode"]).first()
        if not existing:
            emp = Employee(**emp_data)
            db.add(emp)
            db.flush()
            emp_map[emp_data["employeeCode"]] = emp.id
        else:
            emp_map[emp_data["employeeCode"]] = existing.id
    
    # Create Leave Requests
    leave_requests = [
        {
            "employeeId": emp_map["EMP001"],
            "leaveType": "ANNUAL",
            "startDate": datetime(2024, 6, 15),
            "endDate": datetime(2024, 6, 20),
            "status": "APPROVED",
            "reason": "Family vacation",
            "approvedBy": "Robert Chen"
        },
        {
            "employeeId": emp_map["EMP002"],
            "leaveType": "SICK",
            "startDate": datetime(2024, 5, 10),
            "endDate": datetime(2024, 5, 11),
            "status": "APPROVED",
            "reason": "Medical appointment",
            "approvedBy": "Robert Chen"
        }
    ]
    
    for lr_data in leave_requests:
        existing = db.query(LeaveRequest).filter(
            LeaveRequest.employeeId == lr_data["employeeId"],
            LeaveRequest.startDate == lr_data["startDate"]
        ).first()
        if not existing:
            lr = LeaveRequest(**lr_data)
            db.add(lr)
    
    # Create Attendance Logs
    base_date = datetime(2024, 5, 1)
    for i in range(30):  # 30 days of attendance
        date = base_date + timedelta(days=i)
        for emp_code, emp_id in emp_map.items():
            if date.weekday() < 5:  # Weekdays only
                check_in = date.replace(hour=8, minute=random.randint(0, 30))
                check_out = date.replace(hour=17, minute=random.randint(0, 30))
                
                attendance = AttendanceLog(
                    employeeId=emp_id,
                    date=date,
                    checkIn=check_in,
                    checkOut=check_out,
                    status="PRESENT",
                    verificationMethod="BIOMETRIC"
                )
                db.add(attendance)
    
    # Create PaySlips
    for emp_code, emp_id in emp_map.items():
        emp = db.query(Employee).filter(Employee.id == emp_id).first()
        if emp:
            base_salary = emp.baseSalary
            pf_deduction = base_salary * 0.12
            esi_deduction = base_salary * 0.01
            tds_deduction = base_salary * 0.10
            net_pay = base_salary - pf_deduction - esi_deduction - tds_deduction
            
            payslip = PaySlip(
                employeeId=emp_id,
                month=5,
                year=2024,
                baseSalary=base_salary,
                pfDeduction=pf_deduction,
                esiDeduction=esi_deduction,
                tdsDeduction=tds_deduction,
                netPay=net_pay,
                status="PAID"
            )
            db.add(payslip)
    
    # Create Candidates
    candidates = [
        {
            "name": "Alice Thompson",
            "email": "alice.thompson@email.com",
            "phone": "+1-555-2001",
            "jobTitle": "Logistics Manager",
            "status": "INTERVIEW",
            "resumeUrl": "/resumes/alice_thompson.pdf",
            "offerSent": False
        },
        {
            "name": "David Martinez",
            "email": "david.martinez@email.com",
            "phone": "+1-555-2002",
            "jobTitle": "Production Engineer",
            "status": "OFFERED",
            "resumeUrl": "/resumes/david_martinez.pdf",
            "offerSent": True,
            "offerPay": 75000.0
        }
    ]
    
    for cand_data in candidates:
        existing = db.query(Candidate).filter(Candidate.email == cand_data["email"]).first()
        if not existing:
            candidate = Candidate(**cand_data)
            db.add(candidate)
    
    db.commit()
    print("✅ HR data seeded successfully")

def seed_crm_data(db: Session):
    """Seed CRM module with demo data"""
    print("Seeding CRM data...")
    
    # Create Leads
    leads = [
        {
            "name": "Acme Corporation",
            "company": "Acme Corporation",
            "email": "procurement@acme.com",
            "phone": "+1-555-3001",
            "status": "QUALIFIED",
            "source": "Trade Show",
            "value": 150000.0
        },
        {
            "name": "Beta Industries",
            "company": "Beta Industries",
            "email": "purchasing@beta.com",
            "phone": "+1-555-3002",
            "status": "CONTACTED",
            "source": "Website",
            "value": 75000.0
        },
        {
            "name": "Gamma Logistics",
            "company": "Gamma Logistics",
            "email": "operations@gamma.com",
            "phone": "+1-555-3003",
            "status": "NEW",
            "source": "Referral",
            "value": 200000.0
        }
    ]
    
    lead_map = {}
    for lead_data in leads:
        existing = db.query(Lead).filter(Lead.email == lead_data["email"]).first()
        if not existing:
            lead = Lead(**lead_data)
            db.add(lead)
            db.flush()
            lead_map[lead_data["email"]] = lead.id
        else:
            lead_map[lead_data["email"]] = existing.id
    
    # Create Contacts
    contacts = [
        {
            "name": "James Wilson",
            "email": "james.wilson@acme.com",
            "phone": "+1-555-3011",
            "company": "Acme Corporation",
            "leadId": lead_map.get("procurement@acme.com")
        },
        {
            "name": "Lisa Anderson",
            "email": "lisa.anderson@beta.com",
            "phone": "+1-555-3012",
            "company": "Beta Industries",
            "leadId": lead_map.get("purchasing@beta.com")
        }
    ]
    
    for contact_data in contacts:
        existing = db.query(Contact).filter(Contact.email == contact_data["email"]).first()
        if not existing:
            contact = Contact(**contact_data)
            db.add(contact)
    
    # Create Customer Accounts
    accounts = [
        {
            "name": "Acme Corporation",
            "industry": "Manufacturing",
            "phone": "+1-555-3001",
            "billingAddress": "100 Industrial Park, Manufacturing City",
            "isReturning": True
        },
        {
            "name": "Beta Industries",
            "industry": "Logistics",
            "phone": "+1-555-3002",
            "billingAddress": "200 Logistics Blvd, Transport City",
            "isReturning": False
        }
    ]
    
    account_map = {}
    for acc_data in accounts:
        existing = db.query(CustomerAccount).filter(CustomerAccount.name == acc_data["name"]).first()
        if not existing:
            account = CustomerAccount(**acc_data)
            db.add(account)
            db.flush()
            account_map[acc_data["name"]] = account.id
        else:
            account_map[acc_data["name"]] = existing.id
    
    # Create Opportunities
    opportunities = [
        {
            "name": "Q3 Supply Contract",
            "stage": "PROPOSAL",
            "value": 150000.0,
            "closeDate": datetime(2024, 7, 30),
            "leadId": lead_map.get("procurement@acme.com"),
            "accountId": account_map.get("Acme Corporation")
        },
        {
            "name": "Annual Logistics Agreement",
            "stage": "NEGOTIATION",
            "value": 200000.0,
            "closeDate": datetime(2024, 8, 15),
            "leadId": lead_map.get("operations@gamma.com"),
            "accountId": None
        }
    ]
    
    opp_map = {}
    for opp_data in opportunities:
        existing = db.query(Opportunity).filter(Opportunity.name == opp_data["name"]).first()
        if not existing:
            opp = Opportunity(**opp_data)
            db.add(opp)
            db.flush()
            opp_map[opp_data["name"]] = opp.id
        else:
            opp_map[opp_data["name"]] = existing.id
    
    # Create Quotes
    quotes = [
        {
            "quoteNo": "QT-2024-001",
            "opportunityId": opp_map.get("Q3 Supply Contract"),
            "items": json.dumps([
                {"item": "Logistics Services", "quantity": 1, "unit": "contract", "unitPrice": 150000.0}
            ]),
            "subtotal": 150000.0,
            "discount": 7500.0,
            "taxAmount": 14250.0,
            "total": 156750.0,
            "status": "SENT",
            "discountExplanation": "Volume discount for new customer"
        }
    ]
    
    for quote_data in quotes:
        existing = db.query(Quote).filter(Quote.quoteNo == quote_data["quoteNo"]).first()
        if not existing:
            quote = Quote(**quote_data)
            db.add(quote)
    
    db.commit()
    print("✅ CRM data seeded successfully")

def seed_inventory_data(db: Session):
    """Seed Inventory module with demo data"""
    print("Seeding Inventory data...")
    
    # Create Warehouses
    warehouses = [
        {"name": "Main Warehouse", "location": "Industrial Zone A"},
        {"name": "Distribution Center", "location": "Logistics Park B"},
        {"name": "Raw Material Storage", "location": "Factory Site C"}
    ]
    
    warehouse_map = {}
    for wh_data in warehouses:
        existing = db.query(Warehouse).filter(Warehouse.name == wh_data["name"]).first()
        if not existing:
            wh = Warehouse(**wh_data)
            db.add(wh)
            db.flush()
            warehouse_map[wh_data["name"]] = wh.id
        else:
            warehouse_map[wh_data["name"]] = existing.id
    
    # Create Products
    products = [
        {
            "code": "RM-001",
            "name": "Steel Sheet",
            "description": "High-quality steel sheets for manufacturing",
            "type": "RAW_MATERIAL",
            "reorderPoint": 100.0,
            "safetyStock": 50.0,
            "currentStock": 500.0,
            "costPrice": 25.00,
            "salePrice": 35.00
        },
        {
            "code": "RM-002",
            "name": "Aluminum Rod",
            "description": "Aluminum rods for construction",
            "type": "RAW_MATERIAL",
            "reorderPoint": 200.0,
            "safetyStock": 100.0,
            "currentStock": 800.0,
            "costPrice": 15.00,
            "salePrice": 22.00
        },
        {
            "code": "FG-001",
            "name": "Industrial Pump",
            "description": "Heavy-duty industrial pump",
            "type": "FINISHED_GOOD",
            "reorderPoint": 20.0,
            "safetyStock": 10.0,
            "currentStock": 50.0,
            "costPrice": 500.00,
            "salePrice": 750.00
        },
        {
            "code": "FG-002",
            "name": "Conveyor Belt System",
            "description": "Automated conveyor belt system",
            "type": "FINISHED_GOOD",
            "reorderPoint": 5.0,
            "safetyStock": 3.0,
            "currentStock": 15.0,
            "costPrice": 2000.00,
            "salePrice": 3000.00
        },
        {
            "code": "RM-003",
            "name": "Plastic Pellets",
            "description": "Raw plastic pellets for molding",
            "type": "RAW_MATERIAL",
            "reorderPoint": 500.0,
            "safetyStock": 250.0,
            "currentStock": 1500.0,
            "costPrice": 2.50,
            "salePrice": 4.00
        }
    ]
    
    product_map = {}
    for prod_data in products:
        existing = db.query(Product).filter(Product.code == prod_data["code"]).first()
        if not existing:
            prod = Product(**prod_data)
            db.add(prod)
            db.flush()
            product_map[prod_data["code"]] = prod.id
        else:
            product_map[prod_data["code"]] = existing.id
    
    # Create Stock Transactions
    transactions = [
        {
            "productId": product_map["RM-001"],
            "warehouseId": warehouse_map["Raw Material Storage"],
            "quantity": 200.0,
            "unitCost": 25.00,
            "type": "RECEIPT",
            "referenceNo": "PO-2024-001",
            "transactionDate": datetime(2024, 1, 20)
        },
        {
            "productId": product_map["FG-001"],
            "warehouseId": warehouse_map["Main Warehouse"],
            "quantity": 10.0,
            "unitCost": 500.00,
            "type": "ISSUE",
            "referenceNo": "SO-2024-001",
            "transactionDate": datetime(2024, 2, 15)
        },
        {
            "productId": product_map["RM-002"],
            "warehouseId": warehouse_map["Raw Material Storage"],
            "quantity": 300.0,
            "unitCost": 15.00,
            "type": "RECEIPT",
            "referenceNo": "PO-2024-002",
            "transactionDate": datetime(2024, 3, 10)
        }
    ]
    
    for trans_data in transactions:
        trans = StockTransaction(**trans_data)
        db.add(trans)
    
    db.commit()
    print("✅ Inventory data seeded successfully")

def seed_ecommerce_data(db: Session):
    """Seed E-Commerce module with demo data"""
    print("Seeding E-Commerce data...")
    
    # Create Store Products
    store_products = [
        {
            "sku": "SP-001",
            "name": "Industrial Tool Set",
            "description": "Complete industrial tool set for professionals",
            "category": "Tools",
            "price": 299.99,
            "salePrice": 249.99,
            "imageUrl": "/images/tools-set.jpg",
            "stock": 50,
            "isPublished": True,
            "loyaltyPts": 300
        },
        {
            "sku": "SP-002",
            "name": "Safety Equipment Bundle",
            "description": "Complete safety equipment including helmet, gloves, and vest",
            "category": "Safety",
            "price": 149.99,
            "salePrice": None,
            "imageUrl": "/images/safety-bundle.jpg",
            "stock": 100,
            "isPublished": True,
            "loyaltyPts": 150
        },
        {
            "sku": "SP-003",
            "name": "Warehouse Management Software",
            "description": "Cloud-based warehouse management solution",
            "category": "Software",
            "price": 999.99,
            "salePrice": 799.99,
            "imageUrl": "/images/wms-software.jpg",
            "stock": 999,
            "isPublished": True,
            "loyaltyPts": 1000
        },
        {
            "sku": "SP-004",
            "name": "Packaging Supplies Kit",
            "description": "Complete packaging supplies for small business",
            "category": "Packaging",
            "price": 79.99,
            "salePrice": None,
            "imageUrl": "/images/packaging-kit.jpg",
            "stock": 200,
            "isPublished": True,
            "loyaltyPts": 80
        }
    ]
    
    sp_map = {}
    for sp_data in store_products:
        existing = db.query(StoreProduct).filter(StoreProduct.sku == sp_data["sku"]).first()
        if not existing:
            sp = StoreProduct(**sp_data)
            db.add(sp)
            db.flush()
            sp_map[sp_data["sku"]] = sp.id
        else:
            sp_map[sp_data["sku"]] = existing.id
    
    # Create Loyalty Accounts
    loyalty_accounts = [
        {
            "customerEmail": "customer1@email.com",
            "customerName": "John Customer",
            "points": 1500,
            "tier": "SILVER"
        },
        {
            "customerEmail": "customer2@email.com",
            "customerName": "Jane Buyer",
            "points": 3500,
            "tier": "GOLD"
        },
        {
            "customerEmail": "customer3@email.com",
            "customerName": "Bob Shopper",
            "points": 500,
            "tier": "BRONZE"
        }
    ]
    
    loyalty_map = {}
    for la_data in loyalty_accounts:
        existing = db.query(LoyaltyAccount).filter(LoyaltyAccount.customerEmail == la_data["customerEmail"]).first()
        if not existing:
            la = LoyaltyAccount(**la_data)
            db.add(la)
            db.flush()
            loyalty_map[la_data["customerEmail"]] = la.id
        else:
            loyalty_map[la_data["customerEmail"]] = existing.id
    
    # Create Customer Orders
    orders = [
        {
            "orderNo": "ORD-2024-001",
            "customerName": "John Customer",
            "customerEmail": "customer1@email.com",
            "totalAmount": 399.98,
            "discountAmount": 50.00,
            "loyaltyRedeemed": 500,
            "status": "DELIVERED",
            "shippingAddress": "123 Main St, City, State 12345"
        },
        {
            "orderNo": "ORD-2024-002",
            "customerName": "Jane Buyer",
            "customerEmail": "customer2@email.com",
            "totalAmount": 999.99,
            "discountAmount": 200.00,
            "loyaltyRedeemed": 2000,
            "status": "PROCESSING",
            "shippingAddress": "456 Oak Ave, Town, State 67890"
        }
    ]
    
    order_map = {}
    for order_data in orders:
        existing = db.query(CustomerOrder).filter(CustomerOrder.orderNo == order_data["orderNo"]).first()
        if not existing:
            order = CustomerOrder(**order_data)
            db.add(order)
            db.flush()
            order_map[order_data["orderNo"]] = order.id
        else:
            order_map[order_data["orderNo"]] = existing.id
    
    # Create Order Items
    order_items = [
        {
            "orderId": order_map["ORD-2024-001"],
            "productId": sp_map["SP-001"],
            "quantity": 1,
            "unitPrice": 249.99,
            "totalPrice": 249.99
        },
        {
            "orderId": order_map["ORD-2024-001"],
            "productId": sp_map["SP-002"],
            "quantity": 1,
            "unitPrice": 149.99,
            "totalPrice": 149.99
        },
        {
            "orderId": order_map["ORD-2024-002"],
            "productId": sp_map["SP-003"],
            "quantity": 1,
            "unitPrice": 799.99,
            "totalPrice": 799.99
        }
    ]
    
    for oi_data in order_items:
        oi = OrderItem(**oi_data)
        db.add(oi)
    
    db.commit()
    print("✅ E-Commerce data seeded successfully")

def seed_fixed_assets_data(db: Session):
    """Seed Fixed Assets module with demo data"""
    print("Seeding Fixed Assets data...")
    
    # Create Fixed Assets
    assets = [
        {
            "assetCode": "FA-001",
            "name": "CNC Machine",
            "category": "Machinery",
            "location": "Production Floor A",
            "serialNo": "CNC-2023-001",
            "purchaseDate": datetime(2023, 1, 15),
            "purchaseCost": 150000.0,
            "salvageValue": 15000.0,
            "usefulLifeYears": 10,
            "depMethod": "STRAIGHT_LINE",
            "depRate": 0.1,
            "currentBookValue": 135000.0,
            "status": "ACTIVE"
        },
        {
            "assetCode": "FA-002",
            "name": "Delivery Truck",
            "category": "Vehicles",
            "location": "Fleet Yard",
            "serialNo": "TRK-2023-002",
            "purchaseDate": datetime(2023, 3, 20),
            "purchaseCost": 45000.0,
            "salvageValue": 5000.0,
            "usefulLifeYears": 8,
            "depMethod": "STRAIGHT_LINE",
            "depRate": 0.125,
            "currentBookValue": 39375.0,
            "status": "ACTIVE"
        },
        {
            "assetCode": "FA-003",
            "name": "Server Rack",
            "category": "IT Equipment",
            "location": "Data Center",
            "serialNo": "SRV-2023-003",
            "purchaseDate": datetime(2023, 6, 10),
            "purchaseCost": 25000.0,
            "salvageValue": 2500.0,
            "usefulLifeYears": 5,
            "depMethod": "STRAIGHT_LINE",
            "depRate": 0.2,
            "currentBookValue": 22500.0,
            "status": "ACTIVE"
        },
        {
            "assetCode": "FA-004",
            "name": "Forklift",
            "category": "Machinery",
            "location": "Warehouse B",
            "serialNo": "FLT-2022-004",
            "purchaseDate": datetime(2022, 9, 5),
            "purchaseCost": 35000.0,
            "salvageValue": 3500.0,
            "usefulLifeYears": 8,
            "depMethod": "STRAIGHT_LINE",
            "depRate": 0.125,
            "currentBookValue": 28000.0,
            "status": "ACTIVE"
        }
    ]
    
    asset_map = {}
    for asset_data in assets:
        existing = db.query(FixedAsset).filter(FixedAsset.assetCode == asset_data["assetCode"]).first()
        if not existing:
            asset = FixedAsset(**asset_data)
            db.add(asset)
            db.flush()
            asset_map[asset_data["assetCode"]] = asset.id
        else:
            asset_map[asset_data["assetCode"]] = existing.id
    
    # Create Depreciation Logs
    for asset_code, asset_id in asset_map.items():
        asset = db.query(FixedAsset).filter(FixedAsset.id == asset_id).first()
        if asset:
            # Create depreciation log for current year
            dep_amount = asset.purchaseCost * asset.depRate
            closing_value = asset.currentBookValue - dep_amount
            
            dep_log = DepreciationLog(
                assetId=asset_id,
                year=2024,
                openingValue=asset.currentBookValue,
                depAmount=dep_amount,
                closingValue=max(closing_value, asset.salvageValue),
                method=asset.depMethod
            )
            db.add(dep_log)
    
    # Create Maintenance Orders
    maintenance_orders = [
        {
            "workOrderNo": "WO-2024-001",
            "assetId": asset_map.get("FA-001"),
            "title": "Preventive Maintenance - CNC Machine",
            "description": "Regular preventive maintenance including lubrication and calibration",
            "type": "PREVENTIVE",
            "priority": "MEDIUM",
            "assignedTo": "Maintenance Team A",
            "scheduledDate": datetime(2024, 6, 15),
            "completedDate": None,
            "cost": 0.0,
            "status": "OPEN"
        },
        {
            "workOrderNo": "WO-2024-002",
            "assetId": asset_map.get("FA-002"),
            "title": "Oil Change - Delivery Truck",
            "description": "Routine oil change and vehicle inspection",
            "type": "PREVENTIVE",
            "priority": "LOW",
            "assignedTo": "Fleet Maintenance",
            "scheduledDate": datetime(2024, 5, 20),
            "completedDate": datetime(2024, 5, 20),
            "cost": 150.0,
            "status": "COMPLETED"
        },
        {
            "workOrderNo": "WO-2024-003",
            "assetId": asset_map.get("FA-004"),
            "title": "Emergency Repair - Forklift",
            "description": "Hydraulic system repair required",
            "type": "CORRECTIVE",
            "priority": "HIGH",
            "assignedTo": "Maintenance Team B",
            "scheduledDate": datetime(2024, 5, 25),
            "completedDate": None,
            "cost": 0.0,
            "status": "IN_PROGRESS"
        }
    ]
    
    for mo_data in maintenance_orders:
        existing = db.query(MaintenanceOrder).filter(MaintenanceOrder.workOrderNo == mo_data["workOrderNo"]).first()
        if not existing:
            mo = MaintenanceOrder(**mo_data)
            db.add(mo)
    
    db.commit()
    print("✅ Fixed Assets data seeded successfully")

def seed_manufacturing_data(db: Session):
    """Seed Manufacturing module with demo data"""
    print("Seeding Manufacturing data...")
    
    # Get products from inventory
    pump_product = db.query(Product).filter(Product.code == "FG-001").first()
    conveyor_product = db.query(Product).filter(Product.code == "FG-002").first()
    
    if not pump_product or not conveyor_product:
        print("⚠️  Warning: Required products not found, skipping manufacturing data")
        return
    
    # Create Work Centers
    work_centers = [
        {
            "name": "Assembly Line A",
            "capacityHours": 8.0,
            "laborRate": 35.0,
            "machineRate": 50.0,
            "efficiency": 0.95
        },
        {
            "name": "Assembly Line B",
            "capacityHours": 8.0,
            "laborRate": 35.0,
            "machineRate": 50.0,
            "efficiency": 0.90
        },
        {
            "name": "Quality Control Station",
            "capacityHours": 8.0,
            "laborRate": 40.0,
            "machineRate": 25.0,
            "efficiency": 1.0
        }
    ]
    
    wc_map = {}
    for wc_data in work_centers:
        existing = db.query(WorkCenter).filter(WorkCenter.name == wc_data["name"]).first()
        if not existing:
            wc = WorkCenter(**wc_data)
            db.add(wc)
            db.flush()
            wc_map[wc_data["name"]] = wc.id
        else:
            wc_map[wc_data["name"]] = existing.id
    
    # Create Bill of Materials
    boms = [
        {
            "bomNo": "BOM-001",
            "finishedProductId": pump_product.id,
            "name": "Industrial Pump BOM",
            "quantity": 1.0
        },
        {
            "bomNo": "BOM-002",
            "finishedProductId": conveyor_product.id,
            "name": "Conveyor Belt System BOM",
            "quantity": 1.0
        }
    ]
    
    bom_map = {}
    for bom_data in boms:
        existing = db.query(BillOfMaterials).filter(BillOfMaterials.bomNo == bom_data["bomNo"]).first()
        if not existing:
            bom = BillOfMaterials(**bom_data)
            db.add(bom)
            db.flush()
            bom_map[bom_data["bomNo"]] = bom.id
        else:
            bom_map[bom_data["bomNo"]] = existing.id
    
    # Create BOM Components
    # Get raw material products
    steel_sheet = db.query(Product).filter(Product.code == "RM-001").first()
    aluminum_rod = db.query(Product).filter(Product.code == "RM-002").first()
    plastic_pellets = db.query(Product).filter(Product.code == "RM-003").first()
    
    if steel_sheet and aluminum_rod and plastic_pellets:
        bom_components = [
            {
                "bomId": bom_map["BOM-001"],
                "productId": steel_sheet.id,
                "quantity": 10.0
            },
            {
                "bomId": bom_map["BOM-001"],
                "productId": aluminum_rod.id,
                "quantity": 5.0
            },
            {
                "bomId": bom_map["BOM-002"],
                "productId": steel_sheet.id,
                "quantity": 50.0
            },
            {
                "bomId": bom_map["BOM-002"],
                "productId": plastic_pellets.id,
                "quantity": 100.0
            }
        ]
        
        for bc_data in bom_components:
            existing = db.query(BOMComponent).filter(
                BOMComponent.bomId == bc_data["bomId"],
                BOMComponent.productId == bc_data["productId"]
            ).first()
            if not existing:
                bc = BOMComponent(**bc_data)
                db.add(bc)
    
    # Create Production Orders
    production_orders = [
        {
            "orderNo": "PO-2024-MFG-001",
            "finishedProductId": pump_product.id,
            "bomId": bom_map["BOM-001"],
            "workCenterId": wc_map["Assembly Line A"],
            "quantity": 20.0,
            "status": "COMPLETED",
            "startDate": datetime(2024, 4, 1),
            "endDate": datetime(2024, 4, 15)
        },
        {
            "orderNo": "PO-2024-MFG-002",
            "finishedProductId": conveyor_product.id,
            "bomId": bom_map["BOM-002"],
            "workCenterId": wc_map["Assembly Line B"],
            "quantity": 5.0,
            "status": "IN_PROGRESS",
            "startDate": datetime(2024, 5, 1),
            "endDate": None
        },
        {
            "orderNo": "PO-2024-MFG-003",
            "finishedProductId": pump_product.id,
            "bomId": bom_map["BOM-001"],
            "workCenterId": wc_map["Assembly Line A"],
            "quantity": 30.0,
            "status": "PLANNED",
            "startDate": None,
            "endDate": None
        }
    ]
    
    for po_data in production_orders:
        existing = db.query(ProductionOrder).filter(ProductionOrder.orderNo == po_data["orderNo"]).first()
        if not existing:
            po = ProductionOrder(**po_data)
            db.add(po)
    
    # Create OEE Logs
    base_date = datetime(2024, 5, 1)
    for i in range(30):  # 30 days of OEE data
        date = base_date + timedelta(days=i)
        if date.weekday() < 5:  # Weekdays only
            for wc_name, wc_id in wc_map.items():
                planned_production_time = 8.0 * 60  # 8 hours in minutes
                run_time = planned_production_time * random.uniform(0.85, 0.95)
                planned_quantity = 100.0
                total_quantity = planned_quantity * random.uniform(0.90, 1.05)
                good_quantity = total_quantity * random.uniform(0.95, 0.99)
                
                availability = (run_time / planned_production_time) * 100
                performance = (total_quantity / planned_quantity) * 100
                quality = (good_quantity / total_quantity) * 100
                oee_score = (availability * performance * quality) / 10000
                
                oee_log = OEELog(
                    workCenterId=wc_id,
                    date=date,
                    plannedProductionTime=planned_production_time,
                    runTime=run_time,
                    plannedQuantity=planned_quantity,
                    totalQuantity=total_quantity,
                    goodQuantity=good_quantity,
                    availability=availability,
                    performance=performance,
                    quality=quality,
                    oeeScore=oee_score
                )
                db.add(oee_log)
    
    db.commit()
    print("✅ Manufacturing data seeded successfully")

def main():
    """Main seed function"""
    print("=" * 60)
    print("LOGISTICS ERP DEMO DATA SEED SCRIPT")
    print("=" * 60)
    print()
    
    # Create tables
    from app.models.models import Base
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created/verified")
    print()
    
    db = SessionLocal()
    try:
        # First seed RBAC system
        print("Step 1: Seeding RBAC system...")
        from seed_rbac import seed_database
        seed_database()
        print()
        
        # Seed all Logistics ERP modules
        print("Step 2: Seeding Logistics ERP modules...")
        print("-" * 60)
        
        seed_finance_data(db)
        seed_procurement_data(db)
        seed_hr_data(db)
        seed_crm_data(db)
        seed_inventory_data(db)
        seed_ecommerce_data(db)
        seed_fixed_assets_data(db)
        seed_manufacturing_data(db)
        
        print("-" * 60)
        print()
        print("=" * 60)
        print("✅ LOGISTICS ERP DEMO DATA SEEDING COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print()
        print("Summary of seeded data:")
        print("  - Finance: Chart of Accounts, Journal Entries")
        print("  - Procurement: Suppliers, POs, RFQs, Invoices")
        print("  - HR: Departments, Employees, Leave Requests, Attendance, PaySlips")
        print("  - CRM: Leads, Contacts, Opportunities, Quotes")
        print("  - Inventory: Products, Warehouses, Stock Transactions")
        print("  - E-Commerce: Store Products, Orders, Loyalty Accounts")
        print("  - Fixed Assets: Assets, Depreciation Logs, Maintenance Orders")
        print("  - Manufacturing: BOMs, Production Orders, OEE Logs")
        print("  - RBAC: Departments, Roles, Module Access, Users")
        print()
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
