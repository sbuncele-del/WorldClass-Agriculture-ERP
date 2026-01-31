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
exports.pool = void 0;
exports.query = query;
exports.transaction = transaction;
exports.healthCheck = healthCheck;
var pg_1 = require("pg");
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * PostgreSQL Database Configuration
 * Connection pool for efficient database access
 */
var poolConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'worldclass_erp',
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return error after 2 seconds if no connection available
};
// Create the connection pool
exports.pool = new pg_1.Pool(poolConfig);
// Test connection on startup
exports.pool.on('connect', function () {
    console.log('✅ Database connected');
});
exports.pool.on('error', function (err) {
    console.error('❌ Unexpected database error:', err);
    process.exit(-1);
});
/**
 * Execute a query with automatic error handling
 */
function query(text, params) {
    return __awaiter(this, void 0, void 0, function () {
        var start, result, duration, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    start = Date.now();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, exports.pool.query(text, params)];
                case 2:
                    result = _a.sent();
                    duration = Date.now() - start;
                    if (process.env.LOG_QUERIES === 'true') {
                        console.log('📊 Query executed', { text: text, duration: duration, rows: result.rowCount });
                    }
                    return [2 /*return*/, result];
                case 3:
                    error_1 = _a.sent();
                    console.error('❌ Database query error:', error_1);
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Execute a transaction (multiple queries atomically)
 */
function transaction(callback) {
    return __awaiter(this, void 0, void 0, function () {
        var client, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.pool.connect()];
                case 1:
                    client = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 6, 8, 9]);
                    return [4 /*yield*/, client.query('BEGIN')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, callback(client)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, client.query('COMMIT')];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 9];
                case 6:
                    error_2 = _a.sent();
                    return [4 /*yield*/, client.query('ROLLBACK')];
                case 7:
                    _a.sent();
                    throw error_2;
                case 8:
                    client.release();
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    });
}
/**
 * Check if database connection is healthy
 */
function healthCheck() {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, exports.pool.query('SELECT NOW()')];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.rowCount !== null && result.rowCount > 0];
                case 2:
                    error_3 = _a.sent();
                    console.error('Database health check failed:', error_3);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.default = exports.pool;
