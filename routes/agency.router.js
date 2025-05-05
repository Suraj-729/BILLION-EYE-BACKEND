const express = require("express");
const router = express.Router();
// const miniocontroller = require("../controllers/minio.controller");
const { getImageFromMinio } = require('../controllers/minio.controller');
const AgencyController = require("../controllers/agency.controller");

router.post("/agencyId", AgencyController.createAgency);

router.get("/agency-dashboard/:agencyId", AgencyController.getAgencyDashboard);

// router.get("/events/status/:event_id", AgencyController.getEventStatus);

// Route to update event status
router.put("/events/status/:event_id", AgencyController.updateEventStatus);

router.get("/events/:event_id", AgencyController.getEventsById);


// router.get("/proxy-image/:year/:filename", proxyImage);

// router.get('/images/*', miniocontroller.getImage);


router.post("/agencies/login", AgencyController.loginAgency);
router.post("/agencies/logout", AgencyController.logoutAgency);
router.post("/agencies/reset-password", AgencyController.resetPasswordAgency);
router.post("/agencies/requestOtpAgency",AgencyController.requestOtpAgency);


router.get('/:bucket/:year/:filename', getImageFromMinio);


router.get('/incident-images/:event_id', AgencyController.allImage);

// router.get('/proxy-image/:year/:filename', async (req, res) => {
//   const { year, filename } = req.params;

//   const bucket = 'billion-eyes-images';
//   const objectName = ${year}/${filename};

//   try {
 
//     // Pipe the image directly to the response
//     const stream = await minioClient.getObject( objectName);
//     stream.pipe(res);

//   } catch (err) {
//     console.error('MinIO fetch error:', err);
//     res.status(500).send('Failed to retrieve image from MinIO');
//   }
// });
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