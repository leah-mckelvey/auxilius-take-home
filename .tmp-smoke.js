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
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("@auxilius-take-home/types");
var socket_io_client_1 = require("socket.io-client");
var apiBaseUrl = 'http://127.0.0.1:3000';
var webBaseUrl = 'http://127.0.0.1:5173';
var assert = function (condition, message) {
    if (!condition) {
        throw new Error(message);
    }
};
var readJson = function (response, message) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                assert(response.ok, "".concat(message, " status=").concat(response.status));
                return [4 /*yield*/, response.json()];
            case 1: return [2 /*return*/, (_a.sent())];
        }
    });
}); };
var socket = (0, socket_io_client_1.io)(apiBaseUrl, {
    transports: ['polling'],
    forceNew: true,
});
var waitForConnect = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) {
                var timeout = setTimeout(function () { return reject(new Error('socket connect timeout')); }, 5000);
                socket.once('connect', function () {
                    clearTimeout(timeout);
                    resolve();
                });
                socket.once('connect_error', function (error) {
                    clearTimeout(timeout);
                    reject(error);
                });
            })];
    });
}); };
var waitForEvent = function (type, taskId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) {
                var timeout = setTimeout(function () { return reject(new Error("event timeout ".concat(type))); }, 5000);
                socket.once(types_1.TASKS_CHANGED_EVENT, function (event) {
                    clearTimeout(timeout);
                    try {
                        assert(event.type === type, "expected ".concat(type, " got ").concat(event.type));
                        if (taskId !== undefined) {
                            assert(event.taskId === taskId, "expected ".concat(taskId, " got ").concat(event.taskId));
                        }
                        resolve(event);
                    }
                    catch (error) {
                        reject(error);
                    }
                });
                socket.once('connect_error', function (error) {
                    clearTimeout(timeout);
                    reject(error);
                });
            })];
    });
}); };
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    var webResponse, webHtml, health, _a, before, _b, createdEventPromise, created_1, _c, updatedEventPromise, updated, _d, deletedEventPromise, deletedResponse, after, _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                _f.trys.push([0, , 18, 19]);
                return [4 /*yield*/, fetch(webBaseUrl)];
            case 1:
                webResponse = _f.sent();
                return [4 /*yield*/, webResponse.text()];
            case 2:
                webHtml = _f.sent();
                assert(webResponse.ok, "web failed status=".concat(webResponse.status));
                assert(webHtml.includes('<div id="root"></div>'), 'web root missing');
                _a = readJson;
                return [4 /*yield*/, fetch("".concat(apiBaseUrl, "/health"))];
            case 3: return [4 /*yield*/, _a.apply(void 0, [_f.sent(), 'health failed'])];
            case 4:
                health = _f.sent();
                assert(health.status === 'ok', 'health payload mismatch');
                _b = readJson;
                return [4 /*yield*/, fetch("".concat(apiBaseUrl, "/tasks"))];
            case 5: return [4 /*yield*/, _b.apply(void 0, [_f.sent(), 'initial task list failed'])];
            case 6:
                before = _f.sent();
                return [4 /*yield*/, waitForConnect()];
            case 7:
                _f.sent();
                createdEventPromise = waitForEvent('created');
                _c = readJson;
                return [4 /*yield*/, fetch("".concat(apiBaseUrl, "/tasks"), {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({
                            title: 'Smoke task',
                            description: 'live smoke',
                            status: 'todo',
                            createdBy: 'leah',
                        }),
                    })];
            case 8: return [4 /*yield*/, _c.apply(void 0, [_f.sent(), 'create failed'])];
            case 9:
                created_1 = _f.sent();
                return [4 /*yield*/, createdEventPromise];
            case 10:
                _f.sent();
                updatedEventPromise = waitForEvent('updated', created_1.id);
                _d = readJson;
                return [4 /*yield*/, fetch("".concat(apiBaseUrl, "/tasks/").concat(created_1.id), {
                        method: 'PATCH',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({ status: 'done', description: 'updated by smoke' }),
                    })];
            case 11: return [4 /*yield*/, _d.apply(void 0, [_f.sent(), 'update failed'])];
            case 12:
                updated = _f.sent();
                return [4 /*yield*/, updatedEventPromise];
            case 13:
                _f.sent();
                deletedEventPromise = waitForEvent('deleted', created_1.id);
                return [4 /*yield*/, fetch("".concat(apiBaseUrl, "/tasks/").concat(created_1.id), {
                        method: 'DELETE',
                    })];
            case 14:
                deletedResponse = _f.sent();
                assert(deletedResponse.status === 204, "delete failed status=".concat(deletedResponse.status));
                return [4 /*yield*/, deletedEventPromise];
            case 15:
                _f.sent();
                _e = readJson;
                return [4 /*yield*/, fetch("".concat(apiBaseUrl, "/tasks"))];
            case 16: return [4 /*yield*/, _e.apply(void 0, [_f.sent(), 'final task list failed'])];
            case 17:
                after = _f.sent();
                assert(!after.some(function (task) { return task.id === created_1.id; }), 'task still present after delete');
                console.log(JSON.stringify({
                    web: 'ok',
                    health: health,
                    initialCount: before.length,
                    createdTaskId: created_1.id,
                    updatedStatus: updated.status,
                    finalCount: after.length,
                    realtime: ['created', 'updated', 'deleted'],
                }));
                return [3 /*break*/, 19];
            case 18:
                socket.close();
                return [7 /*endfinally*/];
            case 19: return [2 /*return*/];
        }
    });
}); };
main().catch(function (error) {
    console.error(error);
    process.exitCode = 1;
});
