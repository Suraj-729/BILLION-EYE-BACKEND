const AgencyModel  = require("../models/agency.model");
console.log(AgencyModel);



const { getImageCollection } = require("../models/camera.model");
const ImageModel = require("../models/camera.model");
const bcrypt = require("bcryptjs");
const { ObjectId } = require("mongodb");
const { io } = require('../app'); // Import Socket.IO from app.js
// Create A New Agency
async function createAgency(req, res) {
  try {
    const { agencyName, lat, lng, forType, phoneNumber, password } = req.body;
    console.log("[createAgency] Received body:", req.body);

    // Validate required fields
    if (
      !agencyName ||
      lat == null ||
      lng == null ||
      !forType ||
      !phoneNumber ||
      !password
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // Validate phone number (must be 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid phone number. Must be 10 digits.",
        });
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);

    // Create agency entry
    const agencyId = await AgencyModel.createAgency(
      agencyName,
      lat,
      lng,
      forType,
      phoneNumber,
      hashedPassword
    );
    res.status(201).json({ success: true, agencyId });
    console.log(agencyId);
  } catch (error) {
    console.error("[createAgency] Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}


// async function addGroundStaff(req, res) {
//   try {
//     const { agencyId, staffName, phoneNumber } = req.body;

//     // Validate input fields
//     if (!agencyId || !staffName || !phoneNumber) {
//       return res
//         .status(400)
//         .json({ success: false, message: "All fields are required" });
//     }

//     // Validate phone number format
//     const phoneRegex = /^\d{10}$/;
//     if (!phoneRegex.test(phoneNumber)) {
//       return res
//         .status(400)
//         .json({
//           success: false,
//           message: "Invalid phone number. Must be 10 digits.",
//         });
//     }

//     // Check if agency exists

//     // Add ground staff
//     const staffId = await AgencyModel.addGroundStaff(
//       agencyId,
//       staffName,
//       phoneNumber
//     );
//     if (!staffId) {
//       return res
//         .status(500)
//         .json({ success: false, message: "Failed to add ground staff" });
//     }

//     return res.status(201).json({
//       success: true,
//       message: "Ground Staff Added Successfully",
//       staffId,
//     });
//   } catch (error) {
//     console.error("[GroundStaffController] Error:", error);
//     return res
//       .status(500)
//       .json({
//         success: false,
//         message: error.message || "Internal Server Error",
//       });
//   }
// }


  


// async function getUpdateStatus(req, res) {
//   try {
//     console.log("[getUpdateStatus] API hit with params:", req.params);

//     let { incidentID } = req.params;
//     incidentID = incidentID.replace(/^:/, ""); // Remove ":" if mistakenly passed

//     if (!incidentID) {
//       console.warn("[getUpdateStatus] Missing incident ID");
//       return res
//         .status(400)
//         .json({ success: false, message: "Incident ID is required" });
//     }

//     const collection = await getImageCollection();
//     console.log(`[getUpdateStatus] Fetching incident with ID: ${incidentID}`);

//     const incident = await collection.findOne({ incidentID: incidentID }); // Keep it as a string

//     if (!incident) {
//       console.warn(`[getUpdateStatus] Incident not found: ${incidentID}`);
//       return res
//         .status(404)
//         .json({ success: false, message: "Incident not found" });
//     }

//     console.log(`[getUpdateStatus] Incident found:`, incident);

//     res.status(200).json({
//       success: true,
//       status: incident.status || "Unknown",
//       accepted: incident.accepted ?? false, // Ensures 'accepted' is always a boolean
//     });
//   } catch (error) {
//     console.error("[getUpdateStatus] Error:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// }



// async function updateStatus(req, res) {
//   try {
//     console.log("[updateStatus] API hit with params:", req.params);

//     let { incidentID } = req.params;
//     incidentID = incidentID.replace(/^:/, ""); // Remove ":" if mistakenly passed

//     if (!incidentID) {
//       console.warn("[updateStatus] Missing incident ID");
//       return res
//         .status(400)
//         .json({ success: false, message: "Incident ID is required" });
//     }

//     const collection = await getImageCollection();
//     console.log(`[updateStatus] Updating incident with ID: ${incidentID}`);

//     // Update the status in the database
//     const updateResult = await collection.updateOne(
//       { incidentID: incidentID },
//       { $set: { status: "ACTIVE", accepted: true } }
//     );

//     if (updateResult.matchedCount === 0) {
//       console.warn(`[updateStatus] Incident not found: ${incidentID}`);
//       return res
//         .status(404)
//         .json({ success: false, message: "Incident not found" });
//     }

//     console.log(`[updateStatus] Incident updated successfully`);
//     res
//       .status(200)
//       .json({ success: true, message: "Incident status updated to ACTIVE" });
//   } catch (error) {
//     console.error("[updateStatus] Error:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// }
// async function getGroundStaff(req, res) {
//     try {
//       const { agencyId } = req.params;
//       console.log("Request Params:", req.params); // ✅ Log to debug
  
//       // ✅ Validate agencyId
//       if (!agencyId) {
//         return res.status(400).json({ success: false, error: "Agency ID is required." });
//       }
  
//       // ✅ Call the model function
//       const staffList = await AgencyModel.getGroundStaff(agencyId);
  
//       // ✅ Handle empty staff list
//       if (!staffList || staffList.length === 0) {
//         return res.status(404).json({ success: false, error: "No ground staff found for this agency." });
//       }
  
//       // ✅ Send successful response
//       res.status(200).json({ success: true, staffList });
  
//     } catch (error) {
//       console.error("[getGroundStaff] Error:", error);
//       res.status(500).json({ success: false, error: "Internal Server Error" });
//     }
//   }
 

//   const fetchEventWithAgency = async (req, res) => {
//     try {
//         const { eventId } = req.params; // Get eventId from URL parameters

//         if (!eventId) {
//             return res.status(400).json({ message: "Event ID is required." });
//         }

//         const event = await AgencyModel.getEventWithAgency(eventId);

//         res.status(200).json(event);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }

    
// };


const getEventStatus = async (req, res) => {
  try {
      const { event_id } = req.params;

      // Fetch the event details using the correct function from AgencyModel
      const event = await AgencyModel.getEventById(event_id);

      if (!event) {
          return res.status(404).json({ message: "Event not found." });
      }

      return res.status(200).json({ status: event.status });
  } catch (error) {
      console.error("[getEventStatus] Error:", error);
      return res.status(500).json({ message: "Server error." });
  }
};



// const getAgencyDashboard = async (req, res) => {
//   try {
//       const { agencyId } = req.params;

//       if (!agencyId) {
//           return res.status(400).json({ error: "Agency ID is required." });
//       }

//       console.log(`Fetching dashboard for agencyId: ${agencyId}`);

//       const agencyData = await AgencyModel.getAgencyDashboardCheck(agencyId);

//       if (!agencyData) {
//           return res.status(404).json({ message: "Agency not found." });
//       }

//       return res.status(200).json(agencyData);
//   } catch (error) {
//       console.error("[getAgencyDashboard] Error:", error.message);
//       return res.status(500).json({ error: error.message || "Internal Server Error" });
//   }
// };

const getAgencyDashboard = async (req, res) => {
  try {
      const { agencyId } = req.params;

      if (!agencyId) {
          return res.status(400).json({ error: "Agency ID is required." });
      }

      console.log(`Fetching dashboard for agencyId: ${agencyId}`);

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
// const getEventsById = async (req, res) => {
//   try {
//     const { event_id } = req.params;
//     const event = await AgencyModel.getEventById(event_id);

//     if (!event) {
//       return res.status(404).json({ error: "Event not found" });
//     }

//     res.status(200).json(event);
//   } catch (error) {
//     console.error("Error fetching event:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };




// const getEventsById = async (req, res) => {
//   try {
//       const { event_id } = req.params;
//       console.log("Request Params:", req.params);
      
//       const collection = await AgencyModel.getEventsCollection(); // Call function correctly
//       const event = await collection.findOne({ event_id: event_id });

//       if (!event) {
//           return res.status(404).json({ error: "Event not found" });
//       }

//       res.status(200).json(event);
//   } catch (error) {
//       console.error("Error fetching event:", error);
//       res.status(500).json({ error: "Internal Server Error" });
//   }
// };

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









module.exports = {
  createAgency,
  // getUpdateStatus,
  // getLatestEvent,
  // updateStatus,
  // addGroundStaff,
  // fetchEventWithAgency,
  getAgencyDashboard,
  getEventStatus,
  updateEventStatus,
  getEventsById
  
//   getGroundStaff,
};
