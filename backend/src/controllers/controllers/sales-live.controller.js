"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLead = exports.getLeads = exports.deleteCustomer = exports.updateCustomer = exports.createCustomer = exports.getCustomerById = exports.getCustomers = void 0;
var database_1 = __importDefault(require("../config/database"));
// ============================================================================
// CUSTOMER MANAGEMENT - REAL DATABASE QUERIES
// ============================================================================
/**
 * GET /api/sales/customers
 * Fetch all customers from sales.customers table
 */
var getCustomers = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, search, status_1, _b, limit, _c, offset, query, params, paramCount, result, countResult, error_1;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 3, , 4]);
                _a = req.query, search = _a.search, status_1 = _a.status, _b = _a.limit, limit = _b === void 0 ? 50 : _b, _c = _a.offset, offset = _c === void 0 ? 0 : _c;
                query = "\n      SELECT \n        customer_id,\n        company_name,\n        contact_person,\n        email,\n        phone,\n        vat_number,\n        customer_type,\n        source,\n        status,\n        created_at,\n        updated_at\n      FROM sales.customers\n      WHERE 1=1\n    ";
                params = [];
                paramCount = 1;
                if (search) {
                    query += " AND (company_name ILIKE $".concat(paramCount, " OR contact_person ILIKE $").concat(paramCount, " OR email ILIKE $").concat(paramCount, ")");
                    params.push("%".concat(search, "%"));
                    paramCount++;
                }
                if (status_1) {
                    query += " AND status = $".concat(paramCount);
                    params.push(status_1);
                    paramCount++;
                }
                query += " ORDER BY company_name ASC LIMIT $".concat(paramCount, " OFFSET $").concat(paramCount + 1);
                params.push(limit, offset);
                return [4 /*yield*/, database_1.default.query(query, params)];
            case 1:
                result = _d.sent();
                return [4 /*yield*/, database_1.default.query('SELECT COUNT(*) FROM sales.customers WHERE 1=1')];
            case 2:
                countResult = _d.sent();
                res.json({
                    customers: result.rows,
                    total: parseInt(countResult.rows[0].count),
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _d.sent();
                console.error('Error fetching customers:', error_1);
                res.status(500).json({
                    error: 'Failed to fetch customers',
                    details: error_1.message
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getCustomers = getCustomers;
/**
 * GET /api/sales/customers/:id
 * Get a single customer by ID
 */
var getCustomerById = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, result, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                return [4 /*yield*/, database_1.default.query('SELECT * FROM sales.customers WHERE customer_id = $1', [id])];
            case 1:
                result = _a.sent();
                if (result.rows.length === 0) {
                    return [2 /*return*/, res.status(404).json({ error: 'Customer not found' })];
                }
                res.json(result.rows[0]);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('Error fetching customer:', error_2);
                res.status(500).json({
                    error: 'Failed to fetch customer',
                    details: error_2.message
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getCustomerById = getCustomerById;
/**
 * POST /api/sales/customers
 * Create a new customer
 */
var createCustomer = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, company_name, contact_person, email, phone, vat_number, customer_type, source, created_from_document, result, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, company_name = _a.company_name, contact_person = _a.contact_person, email = _a.email, phone = _a.phone, vat_number = _a.vat_number, customer_type = _a.customer_type, source = _a.source, created_from_document = _a.created_from_document;
                // Validate required fields
                if (!company_name) {
                    return [2 /*return*/, res.status(400).json({ error: 'Company name is required' })];
                }
                return [4 /*yield*/, database_1.default.query("INSERT INTO sales.customers (\n        company_name, \n        contact_person, \n        email, \n        phone, \n        vat_number, \n        customer_type,\n        source,\n        created_from_document,\n        status\n      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active') \n      RETURNING *", [company_name, contact_person, email, phone, vat_number, customer_type || 'logistics_broker', source || 'manual', created_from_document])];
            case 1:
                result = _b.sent();
                res.status(201).json(result.rows[0]);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _b.sent();
                console.error('Error creating customer:', error_3);
                res.status(500).json({
                    error: 'Failed to create customer',
                    details: error_3.message
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createCustomer = createCustomer;
/**
 * PUT /api/sales/customers/:id
 * Update an existing customer
 */
var updateCustomer = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, company_name, contact_person, email, phone, vat_number, customer_type, status_2, result, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                id = req.params.id;
                _a = req.body, company_name = _a.company_name, contact_person = _a.contact_person, email = _a.email, phone = _a.phone, vat_number = _a.vat_number, customer_type = _a.customer_type, status_2 = _a.status;
                return [4 /*yield*/, database_1.default.query("UPDATE sales.customers \n       SET company_name = COALESCE($1, company_name),\n           contact_person = COALESCE($2, contact_person),\n           email = COALESCE($3, email),\n           phone = COALESCE($4, phone),\n           vat_number = COALESCE($5, vat_number),\n           customer_type = COALESCE($6, customer_type),\n           status = COALESCE($7, status),\n           updated_at = CURRENT_TIMESTAMP\n       WHERE customer_id = $8\n       RETURNING *", [company_name, contact_person, email, phone, vat_number, customer_type, status_2, id])];
            case 1:
                result = _b.sent();
                if (result.rows.length === 0) {
                    return [2 /*return*/, res.status(404).json({ error: 'Customer not found' })];
                }
                res.json(result.rows[0]);
                return [3 /*break*/, 3];
            case 2:
                error_4 = _b.sent();
                console.error('Error updating customer:', error_4);
                res.status(500).json({
                    error: 'Failed to update customer',
                    details: error_4.message
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateCustomer = updateCustomer;
/**
 * DELETE /api/sales/customers/:id
 * Delete a customer
 */
var deleteCustomer = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, result, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                return [4 /*yield*/, database_1.default.query('DELETE FROM sales.customers WHERE customer_id = $1 RETURNING *', [id])];
            case 1:
                result = _a.sent();
                if (result.rows.length === 0) {
                    return [2 /*return*/, res.status(404).json({ error: 'Customer not found' })];
                }
                res.json({
                    message: 'Customer deleted successfully',
                    customer: result.rows[0]
                });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                console.error('Error deleting customer:', error_5);
                res.status(500).json({
                    error: 'Failed to delete customer',
                    details: error_5.message
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deleteCustomer = deleteCustomer;
// ============================================================================
// LEAD MANAGEMENT - REAL DATABASE QUERIES
// ============================================================================
/**
 * GET /api/sales/leads
 * Fetch all leads
 */
var getLeads = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, search, status_3, source, _b, limit, _c, offset, query, params, paramCount, result, error_6;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 2, , 3]);
                _a = req.query, search = _a.search, status_3 = _a.status, source = _a.source, _b = _a.limit, limit = _b === void 0 ? 50 : _b, _c = _a.offset, offset = _c === void 0 ? 0 : _c;
                query = "\n      SELECT \n        customer_id as id,\n        company_name as lead_name,\n        company_name,\n        contact_person,\n        email as contact,\n        phone,\n        source,\n        status,\n        customer_type,\n        created_at\n      FROM sales.customers\n      WHERE 1=1\n    ";
                params = [];
                paramCount = 1;
                if (search) {
                    query += " AND (company_name ILIKE $".concat(paramCount, " OR contact_person ILIKE $").concat(paramCount, ")");
                    params.push("%".concat(search, "%"));
                    paramCount++;
                }
                if (status_3) {
                    query += " AND status = $".concat(paramCount);
                    params.push(status_3);
                    paramCount++;
                }
                if (source) {
                    query += " AND source = $".concat(paramCount);
                    params.push(source);
                    paramCount++;
                }
                query += " ORDER BY created_at DESC LIMIT $".concat(paramCount, " OFFSET $").concat(paramCount + 1);
                params.push(limit, offset);
                return [4 /*yield*/, database_1.default.query(query, params)];
            case 1:
                result = _d.sent();
                res.json({
                    leads: result.rows,
                    total: result.rows.length
                });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _d.sent();
                console.error('Error fetching leads:', error_6);
                res.status(500).json({
                    error: 'Failed to fetch leads',
                    details: error_6.message
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getLeads = getLeads;
/**
 * POST /api/sales/leads
 * Create a new lead (as customer)
 */
var createLead = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, lead_name, company, contact_person, contact, phone, source, status_4, result, error_7;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, lead_name = _a.lead_name, company = _a.company, contact_person = _a.contact_person, contact = _a.contact, phone = _a.phone, source = _a.source, status_4 = _a.status;
                return [4 /*yield*/, database_1.default.query("INSERT INTO sales.customers (\n        company_name, \n        contact_person, \n        email, \n        phone, \n        source,\n        status,\n        customer_type\n      ) VALUES ($1, $2, $3, $4, $5, $6, 'lead') \n      RETURNING *", [company || lead_name, contact_person, contact, phone, source || 'manual', status_4 || 'new'])];
            case 1:
                result = _b.sent();
                res.status(201).json(result.rows[0]);
                return [3 /*break*/, 3];
            case 2:
                error_7 = _b.sent();
                console.error('Error creating lead:', error_7);
                res.status(500).json({
                    error: 'Failed to create lead',
                    details: error_7.message
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createLead = createLead;
