const express = require("express");
const router = express.Router();

const AgencyController = require('../controllers/agency.controller');

router.post('/agencyId', AgencyController.createAgency);

// router.get('/user/images', AgencyController.getImages);
router.get("/user/images/latest", AgencyController.getLatestImage);


module.exports = router;