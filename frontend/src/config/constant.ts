const schoolStatus = {
    NEW_REGISTRATION: 'new_registration',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    CLOSED: 'closed',
    CLOSURE_REQUESTED: 'closure_requested'
}

const role = {
    SUPER_ADMIN: 'super_admin',
    ADMIN_STAFF: 'admin_staff',
    PRINCIPAL: 'principal',
    ACCOUNTANT: 'accountant',
    TEACHER: 'teacher',
    STUDENT: 'student',
}

const dayOfWeek = {
    MONDAY: 'monday',
    TUESDAY: 'tuesday',
    WEDNESDAY: 'wednesday',
    THURSDAY: 'thursday',
    FRIDAY: 'friday',
    SATURDAY: 'saturday',
    SUNDAY: 'sunday',
}
const classMode = {
    ONLINE: 'online',
    OFFLINE: 'offline',
}
const userStatus = {
    ACTIVE: 'active',
    INACTIVE: 'inactive'
}

export { schoolStatus, role, userStatus, dayOfWeek, classMode }