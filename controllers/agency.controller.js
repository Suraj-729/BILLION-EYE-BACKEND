const AgencyModel  = require("../models/agency.model");
console.log(AgencyModel);
const bcrypt = require("bcryptjs");

// Create A New Agency
async function createAgency(req, res) {
  try {
    console.log("[createAgency] Function called");
    console.log("[createAgency] Request body received:", req.body);

    const { AgencyName, mobileNumber, password, lat, lng } = req.body;

    // Validate required fields
    if (!AgencyName || !mobileNumber || !password) {
      console.warn("[createAgency] Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Agency name, mobile number, and password are required.",
      });
    }

    // Validate and prepare location
    const location = {};
    if (lat !== undefined || lng !== undefined) {
      console.log("[createAgency] Validating location:", { lat, lng });
      if (typeof lat !== "number" || typeof lng !== "number") {
        console.warn("[createAgency] Invalid location values");
        return res.status(400).json({
          success: false,
          message: "Latitude and longitude must be numeric values.",
        });
      }
      location.latitude = lat;
      location.longitude = lng;
    }

    console.log("[createAgency] Calling createAgencyInDB with:", {
      AgencyName,
      mobileNumber,
      password,
      location,
    });

    // Call the model function to create the agency
    const agencyId = await AgencyModel.createAgencyInDB(
      AgencyName,
      mobileNumber,
      password,
      location
    );

    console.log("[createAgency] Agency created successfully with ID:", agencyId);

    // Send success response
    return res.status(201).json({
      success: true,
      message: "Agency created successfully.",
      agencyId,
    });

  } catch (error) {
    console.error("[createAgency Controller] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error. Please try again later.",
    });
  }
}


async function loginAgency(req, res) {
  try {
    console.log("[loginAgency] Function called");
    console.log("[loginAgency] Request body received:", req.body);

    const { mobileNumber, password } = req.body;

    // Validate required fields
    if (!mobileNumber || !password) {
      console.warn("[loginAgency] Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Mobile number and password are required.",
      });
    }

    // Call the model function to handle login
    const result = await AgencyModel.agencyLogin(mobileNumber, password);

    console.log("[loginAgency] Login successful for AgencyId:", result.agency.AgencyId);

    // Send success response
    return res.status(200).json(result);
  } catch (error) {
    console.error("[loginAgency] Error:", error.message);
    return res.status(401).json({
      success: false,
      message: error.message || "Login failed.",
    });
  }
}




const getAgencyDashboard = async (req, res) => {
  try {
    console.log("`[DEBUG] Request Params:", req.params); // Log the request parameters
    
      const { agencyId } = req.params;

      if (!agencyId) {
          return res.status(400).json({ error: "Agency ID is required." });
      }

      console.log(`Fetching dashboard data for agencyId: ${agencyId}`);

      const agencyData = await AgencyModel.getAgencyDashboardCheck(agencyId);

      if (!agencyData) {
          return res.status(404).json({ message: "Agency not found or no events assigned." });
      }

      return res.status(200).json(agencyData);
  } catch (error) {
      console.error("[getAgencyDashboard] Error:", error.message);
      return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};


// Controller to update event status
const updateEventStatus = async (req, res) => {
  try {
      const { event_id } = req.params; // Get event_id from URL
      const { status } = req.body; // Get new status from request body

      if (!status) {
          return res.status(400).json({ message: "Status is required." });
      }

      const result = await AgencyModel.updateEventStatus(event_id, status);

      if (result.modifiedCount === 0) {
          return res.status(404).json({ message: "Event not found or status unchanged." });
      }

      return res.status(200).json({ message: "Event status updated successfully." });
  } catch (error) {
      console.error("[updateEventStatus] Error:", error);
      return res.status(500).json({ message: "Server error." });
  }
};


const  getEventsById= async (req, res)  =>{
  try {
    const { event_id } = req.params;

    // Parse optional query params
    const fields = req.query.fields ? req.query.fields.split(",") : [];
    const includeImageUrl = req.query.includeImageUrl !== "false"; // Defaults to true

    const event = await AgencyModel.getEventById(event_id, fields, includeImageUrl);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}








async function requestOtpAgency(req, res) {
  try {
    const { agencyId, mobileNumber } = req.body;

    if (!agencyId || !mobileNumber) {
      return res.status(400).json({ message: "Agency ID and mobile number are required" });
    }

    if (!/^\d{10}$/.test(mobileNumber.trim())) {
      return res.status(400).json({ message: "Invalid mobile number format" });
    }

    const agency = await AgencyModel.findOne({ agencyId: agencyId.trim() });

    if (!agency || agency.mobileNumber !== mobileNumber.trim()) {
      return res.status(400).json({ message: "Invalid agency ID or mobile number" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await AgencyModel.updateOTP(mobileNumber.trim(), otp);

    console.log(`[requestOtpAgency] OTP sent: ${otp}`);
    res.status(200).json({ message: "OTP sent successfully", otp }); // Remove 'otp' in production
  } catch (error) {
    console.error("[requestOtpAgency] Fatal error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

async function resetPasswordAgency(req, res) {
  try {
    const { agencyId, newPassword } = req.body;
    console.log("[resetPasswordAgency] Received body:", req.body);

    // Validate required fields
    if (!agencyId || !newPassword) {
      console.warn("[resetPasswordAgency] Missing required fields");
      return res.status(400).json({ success: false, message: "Agency ID and new password are required" });
    }

    // Find agency
    const agency = await AgencyModel.findOne({ agencyId: agencyId.trim() });
    console.log("[resetPasswordAgency] Fetched Agency:", agency);
    if (!agency) {
      console.warn("[resetPasswordAgency] Agency not found for ID:", agencyId);
      return res.status(404).json({ success: false, message: "Agency not found" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the agency using our new method (instead of calling agency.save())
    const success = await AgencyModel.updatePassword(agencyId.trim(), hashedPassword);

    if (success) {
      console.log("[resetPasswordAgency] Password reset successful for:", agencyId);
      return res.status(200).json({ success: true, message: "Password reset successful" });
    } else {
      console.warn("[resetPasswordAgency] Password update failed");
      return res.status(500).json({ success: false, message: "Password update failed" });
    }
  } catch (error) {
    console.error("[resetPasswordAgency] Error:", error.stack || error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


async function logoutAgency (req, res) {
  res.clearCookie("agency_token","refreshToken", {
    httpOnly: true,
    sameSite: "Strict",
    secure: process.env.NODE_ENV === "production",
  });
  return res.status(200).json({ success: true, message: "Logged out successfully" });
};


//login




async function allImage(req, res) {
  try {
    const { event_id } = req.params;
    console.log(req.params);

    // Fetch the event and incidents data
    const event = await AgencyModel.getEventById(event_id);
    console.log(event, "event data");

    if (!event || !Array.isArray(event.incidents)) {
      console.error("Event not found or incidents is not an array.");
      return res.status(404).json({ message: "Event not found or has no incidents." });
    }

    // Ensure incidents is an array before processing
    const incidents = Array.isArray(event.incidents) ? event.incidents : [];
    console.log(incidents, "incident data");

    // Use the model function to get the incident images and bounding boxes
    const incidentImages = await AgencyModel.getIncidentImages(incidents);

    return res.status(200).json({
      event_id: event.event_id,
      incidents: incidentImages,
    });

  } catch (error) {
    console.error('[allImage] Error:', error.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}



async function getEventReport(req, res) {
  try {
    const { event_id } = req.params;

    // Fetch the event report from the model
    const eventReport = await AgencyModel.getEventReportId(event_id);

    if (!eventReport) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    // Prepare the response with the required fields
    const response = {
      success: true,
      assignment_time: eventReport.assignment_time || null,
      AgencyName: eventReport.AgencyName,
      event_id: eventReport.event_id,
      description: eventReport.description,
      ground_staff: eventReport.ground_staff || null,
      latitude: eventReport.latitude || null,
      longitude: eventReport.longitude || null,
      image_url: eventReport.image_url || null,
       // Include assignedAgency
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("[getEventReport] Error:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}





module.exports = {
  createAgency,
  
  getAgencyDashboard,
  // getEventStatus,
  updateEventStatus,
  getEventsById,
  loginAgency,
  allImage,
  getEventReport,

  logoutAgency, 
  // addGroundStaff,
  // deleteIncident,
  resetPasswordAgency,
  requestOtpAgency,
  
//   getGroundStaff,
};