const express = require("express");
const router = express.Router();

const { getImageFromMinio } = require('../controllers/minio.controller');
const AgencyController = require("../controllers/agency.controller");

router.post("/agency",AgencyController.createAgency);

router.get("/agency-dashboard/:agencyId", AgencyController.getAgencyDashboard);

router.get("/event-report/:event_id", AgencyController.getEventReport);

// Route to update event status
router.put("/events/status/:event_id", AgencyController.updateEventStatus);

router.get("/events/:event_id", AgencyController.getEventsById);




router.post("/agency/login", AgencyController.loginAgency);
router.post("/agencies/logout", AgencyController.logoutAgency);
router.post("/agencies/reset-password", AgencyController.resetPasswordAgency);
router.post("/agencies/requestOtpAgency",AgencyController.requestOtpAgency);
router.post("/agencyId", AgencyController.createAgency);

router.get('/:bucket/:year/:filename', getImageFromMinio);


router.get('/incident-images/:event_id', AgencyController.allImage);


module.exports = router;
