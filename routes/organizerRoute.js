import { Router } from "express";
import { orgLogin, orgRegister } from "../controllers/orgController.js";


const router = Router();

router.post("/org/register",orgRegister)
router.post("/org/login",orgLogin)


export { router as organizerRoutes };
