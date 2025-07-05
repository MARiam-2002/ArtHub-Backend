import { roles } from "../../middleware/auth.middleware.js";

export const endPoint = {
    read: [roles.admin, roles.superAdmin]
}; 