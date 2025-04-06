const express = require("express");
const router = express.Router();

const AgencyController = require('../controllers/agency.controller');

router.post('/agencyId', AgencyController.createAgency);

router.get("/agency-dashboard/:agencyId", AgencyController.getAgencyDashboard);

router.get("/events/status/:event_id", AgencyController.getEventStatus);

// Route to update event status
router.put("/events/status/:event_id", AgencyController.updateEventStatus);

router.get("/events/:event_id", AgencyController.getEventsById);

module.exports = router;



//const {getImagesByStatus} = require("../models/camera.model");
// const ImageController = require('../controllers/images.controller')

// ✅ Fetch Recent Images

// router.get('/user/images', ImageController.getImageData);
// router.get("/user/images/latest", AgencyController.getLatestImage);

// router.get("/images/:status", async (req, res) => {
//   try {
//     const { status } = req.params;
//     const validStatuses = ["ACTIVE", "ASSIGNED", "RESOLVED"];
    
//     if (!validStatuses.includes(status.toUpperCase())) {

//       return res.status(400).json({ error: "Invalid status" });

//     }

//     const images = await getImagesByStatus(status.toUpperCase());

//     res.json(images);

//   } catch (error) {
//     res.status(500).json({ error: "Error fetching images by status" });
//   }
// });
// router.get("/images/status/:incidentID", AgencyController.getUpdateStatus);
// router.put("/images/status/:incidentID", AgencyController.updateStatus);
// router.get("/images/status", AgencyController.getUpdateStatus);

// router.post("/addGroundStaff",AgencyController.addGroundStaff);

// router.get("/event-with-agency/:eventId", AgencyController.fetchEventWithAgency);