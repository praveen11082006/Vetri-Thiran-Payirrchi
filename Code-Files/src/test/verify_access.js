/**
 * Verification - run in Scripts - Background (Global) as admin.
 * Counts visible rows per user using GlideRecordSecure (ACLs enforced).
 * Expected: EEEUser -> 2 (EEE only), admin -> 6, user without bb1 -> 0.
 */
(function () {
    var TABLE = 'u_institution_details';
    function countAs(userName) {
        var u = new GlideRecord('sys_user');
        if (!u.get('user_name', userName)) { gs.print('User not found: ' + userName); return; }
        var imp = new GlideImpersonate();
        var me = gs.getUserID();
        imp.impersonate(u.getUniqueValue());
        var gr = new GlideRecordSecure(TABLE);
        gr.query();
        var branches = [];
        while (gr.next()) branches.push(gr.getValue('u_branch'));
        imp.impersonate(me);
        gs.print(userName + ' sees ' + branches.length + ' row(s): ' + branches.join(','));
    }
    countAs('EEEUser');
    countAs('admin');
    // countAs('some.user.without.bb1');
})();
