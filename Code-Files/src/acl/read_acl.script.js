// READ ACL - u_institution_details
// Type: record | Operation: read | Decision: Allow If | Advanced: true
// Requires role: bb1 | Data condition: Branch is EEE
(function () {
    // Allow admin users full access
    if (gs.hasRole('admin')) {
        return true;
    }
    // Row filtering is done by the data condition (Branch is EEE);
    // the script confirms the caller holds bb1.
    if (gs.hasRole('bb1')) {
        return true;
    }
    // Deny access for all others
    return false;
})();
