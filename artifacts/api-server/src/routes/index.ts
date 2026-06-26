import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import itemsRouter from "./items";
import bookingsRouter from "./bookings";
import paymentsRouter from "./payments";
import usersRouter from "./users";
import statsRouter from "./stats";
import reviewsRouter from "./reviews";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(itemsRouter);
router.use(bookingsRouter);
router.use(paymentsRouter);
router.use(usersRouter);
router.use(statsRouter);
router.use(reviewsRouter);

export default router;
