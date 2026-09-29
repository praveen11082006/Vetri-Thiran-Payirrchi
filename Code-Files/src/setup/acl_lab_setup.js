/**
 * Script-Controlled ACL - Restrict Record Access Based on Field Value
 * One-shot setup for the lab. Run in: System Definition > Scripts - Background
 * Scope: Global   |   Prerequisite: elevate to security_admin first
 * Safe to re-run: every step checks for existing records.
 * Run on a PDI / sub-production instance, not on production.
 */
(function () {
    var TABLE = 'u_institution_details';
    var ROLES = ['bb1', 'bb2', 'bb3', 'bb4'];
    var LAB_USER = { user_name: 'EEEUser', first_name: 'EEE', last_name: 'User', email: 'eeeuser@gmail.com' };
    var TEMP_PASSWORD = 'ChangeMe#2026'; // change before running

    function log(m) { gs.print('[ACL-LAB] ' + m); }

    function findOne(table, query) {
        var gr = new GlideRecord(table);
        gr.addEncodedQuery(query);
        gr.setLimit(1);
        gr.query();
        return gr.next() ? gr : null;
    }

    // ---------- 1. Roles ----------
    var roleIds = {};
    ROLES.forEach(function (r) {
        var ex = findOne('sys_user_role', 'name=' + r);
        if (ex) { roleIds[r] = ex.getUniqueValue(); log('Role exists: ' + r); return; }
        var gr = new GlideRecord('sys_user_role');
        gr.initialize();
        gr.name = r;
        gr.description = 'ACL lab role ' + r;
        roleIds[r] = gr.insert();
        log('Role created: ' + r);
    });

    // ---------- 2. Lab user + role assignment ----------
    var lab = findOne('sys_user', 'user_name=' + LAB_USER.user_name);
    var labId;
    if (lab) {
        labId = lab.getUniqueValue();
        log('User exists: ' + LAB_USER.user_name);
    } else {
        var u = new GlideRecord('sys_user');
        u.initialize();
        u.user_name = LAB_USER.user_name;
        u.first_name = LAB_USER.first_name;
        u.last_name = LAB_USER.last_name;
        u.email = LAB_USER.email;
        u.active = true;
        u.user_password.setDisplayValue(TEMP_PASSWORD);
        labId = u.insert();
        log('User created: ' + LAB_USER.user_name);
    }
    ROLES.forEach(function (r) {
        if (findOne('sys_user_has_role', 'user=' + labId + '^role=' + roleIds[r])) return;
        var g = new GlideRecord('sys_user_has_role');
        g.initialize();
        g.user = labId;
        g.role = roleIds[r];
        g.insert();
        log('Assigned ' + r + ' to ' + LAB_USER.user_name);
    });

    // ---------- 3. Table ----------
    if (!findOne('sys_db_object', 'name=' + TABLE)) {
        var t = new GlideRecord('sys_db_object');
        t.initialize();
        t.name = TABLE;
        t.label = 'Institution Details';
        t.is_extendable = false;
        t.create_access_controls = false; // lab creates its own ACLs
        t.insert();
        log('Table created: ' + TABLE);
    } else {
        log('Table exists: ' + TABLE);
    }

    // ---------- 4. Number maintenance (INS0001001 ...) ----------
    if (!findOne('sys_number', 'category=' + TABLE)) {
        var n = new GlideRecord('sys_number');
        n.initialize();
        n.category = TABLE;
        n.prefix = 'INS';
        n.number = 1001;
        n.maximum_digits = 7;
        n.insert();
        log('Number maintenance created (prefix INS)');
    }

    // ---------- 5. Columns ----------
    var columns = [
        { el: 'u_student_roll_number', label: 'Student Roll Number', type: 'string', len: 40, def: 'javascript:global.getNextObjNumberPadded();' },
        { el: 'u_student_name', label: 'Student Name', type: 'reference', ref: 'sys_user', len: 32 },
        { el: 'u_faculty_name', label: 'Faculty name', type: 'reference', ref: 'sys_user', len: 32 },
        { el: 'u_branch', label: 'Branch', type: 'string', len: 40, choice: 1 },
        { el: 'u_email', label: 'Email', type: 'string', len: 40 },
        { el: 'u_phone_number', label: 'Phone Number', type: 'string', len: 40 },
        { el: 'u_description', label: 'Description', type: 'string', len: 1000 }
    ];
    columns.forEach(function (c) {
        if (findOne('sys_dictionary', 'name=' + TABLE + '^element=' + c.el)) return;
        var d = new GlideRecord('sys_dictionary');
        d.initialize();
        d.name = TABLE;
        d.element = c.el;
        d.column_label = c.label;
        d.internal_type = c.type;
        d.max_length = c.len;
        if (c.ref) d.reference = c.ref;
        if (c.def) d.default_value = c.def;
        if (c.choice) d.choice = c.choice;
        d.active = true;
        d.insert();
        log('Column created: ' + c.el);
    });

    // Branch choices
    ['ECE', 'EEE', 'CSE'].forEach(function (b, i) {
        if (findOne('sys_choice', 'name=' + TABLE + '^element=u_branch^value=' + b)) return;
        var ch = new GlideRecord('sys_choice');
        ch.initialize();
        ch.name = TABLE;
        ch.element = 'u_branch';
        ch.value = b;
        ch.label = b;
        ch.sequence = (i + 1) * 100;
        ch.insert();
    });

    // ---------- 6. Sample records ----------
    function userByName(name) {
        var ex = findOne('sys_user', 'name=' + name);
        if (ex) return ex.getUniqueValue();
        var parts = name.split(' ');
        var nu = new GlideRecord('sys_user');
        nu.initialize();
        nu.user_name = name.replace(/\s+/g, '');
        nu.first_name = parts[0];
        nu.last_name = parts.slice(1).join(' ');
        nu.active = true;
        log('Sample user created: ' + name);
        return nu.insert();
    }

    var samples = [
        ['Praneeth', 'ITIL User', 'ECE', 'praneeth@gmail.com', '8989090906'],
        ['Abraham Lincoln', 'Malla Sravan kumar', 'CSE', 'sravan@gmail.com', '8978908989'],
        ['Srinu Nandipalli', 'ITIL User', 'ECE', 'srinu@gmail.com', '9089090090'],
        ['Guna Sai', 'Abel Tuter', 'EEE', 'saiguna@gmail.com', '9090898765'],
        ['Yaswanth Nikku', 'Abraham Lincoln', 'CSE', 'yaswanth@gmail.com', '8989898989'],
        ['Prashanth Reddy', 'Abel Tuter', 'EEE', 'prashanth@gmail.com', '9090909090']
    ];
    var existing = new GlideRecord(TABLE);
    existing.query();
    if (existing.getRowCount() === 0) {
        samples.forEach(function (s) {
            var r = new GlideRecord(TABLE);
            r.initialize();
            r.u_student_name = userByName(s[0]);
            r.u_faculty_name = userByName(s[1]);
            r.u_branch = s[2];
            r.u_email = s[3];
            r.u_phone_number = s[4];
            r.insert();
        });
        log('Sample records inserted: ' + samples.length);
    } else {
        log('Table already has records; skipping samples');
    }

    // ---------- 7. ACLs ----------
    var typeRec = findOne('sys_security_type', 'name=record');
    var READ_SCRIPT =
        "(function () {\n" +
        "    // Allow admin users full access\n" +
        "    if (gs.hasRole('admin')) {\n        return true;\n    }\n" +
        "    // Row filtering is done by the data condition (Branch is EEE);\n" +
        "    // the script only confirms the caller holds bb1.\n" +
        "    if (gs.hasRole('bb1')) {\n        return true;\n    }\n" +
        "    // Deny access for all others\n" +
        "    return false;\n" +
        "})();";

    function createAcl(op, roleName, opts) {
        opts = opts || {};
        if (findOne('sys_security_acl', 'name=' + TABLE + '^operation.name=' + op)) {
            log('ACL exists: ' + op);
            return;
        }
        var opRec = findOne('sys_security_operation', 'name=' + op);
        var a = new GlideRecord('sys_security_acl');
        a.initialize();
        a.name = TABLE;
        a.type = typeRec ? typeRec.getUniqueValue() : '';
        a.operation = opRec ? opRec.getUniqueValue() : '';
        a.decision_type = 'allow';
        a.admin_overrides = true;
        a.active = true;
        if (opts.script) {
            a.advanced = true;
            a.script = opts.script;
        }
        if (opts.condition) a.condition = opts.condition;
        var id = a.insert();
        var link = new GlideRecord('sys_security_acl_role');
        link.initialize();
        link.sys_security_acl = id;
        link.sys_user_role = roleIds[roleName];
        link.insert();
        log('ACL created: ' + op + ' -> ' + roleName);
    }

    createAcl('read', 'bb1', { script: READ_SCRIPT, condition: 'u_branch=EEE' });
    createAcl('create', 'bb2');
    createAcl('write', 'bb3');
    createAcl('delete', 'bb4');

    log('Done. Impersonate EEEUser, then open ' + TABLE + '_list.do to verify.');
})();
