const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
const { getLocalIpAddress } = require('../utlils/network');
const uri = process.env.DB_CONNECT;
const client = new MongoClient(uri);

async function getAgencyCollection() {
  if (!client.topology || !client.topology.isConnected()) {
    await client.connect();
  }

  const db = client.db("BillionEyes_V1");
  return db.collection("agencies");
}

async function getCriticalCollection() {
  const db = client.db("BillionEyes_V1");
  return db.collection("critical_agencies");
}

async function getNonCriticalCollection() {
  const db = client.db("BillionEyes_V1");
  return db.collection("non_critical_agencies");
}
async function getGroundStaffCollection() {
  const db = client.db("BillionEyes_V1");
  return db.collection("ground_staff");
}

const AgencyModel = {
  async createAgency(agencyName, lat, lng, forType, phoneNumber, password) {
    const agencyCollection = await getAgencyCollection();
    const criticalCollection = await getCriticalCollection();
    const nonCriticalCollection = await getNonCriticalCollection();

    // ✅ Validate phone number (Basic check)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      throw new Error("Invalid phone number. Must be 10 digits.");
    }

    // ✅ Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Validate 'forType' to allow only 'Critical' or 'Non-Critical'
    if (!["Critical", "Non-Critical"].includes(forType)) {
      throw new Error(
        "Invalid 'forType'. Must be 'Critical' or 'Non-Critical'."
      );
    }

    // ✅ Custom Agency ID logic
    const agencyId = `OD-${Math.floor(10 + Math.random() * 90)}-${Math.floor(
      10 + Math.random() * 90
    )}`;

    // ✅ Create the agency object
    const agency = {
      AgencyId: agencyId,
      AgencyName: agencyName,
      Location: { lat, lng },
      PhoneNumber: phoneNumber,
      Password: hashedPassword,
      For: forType,
      createdAt: new Date(),
    };

    try {
      // ✅ Insert into the main "agencies" collection
      await agencyCollection.insertOne(agency);
      console.log("[createAgency] New agency inserted:", {
        agencyId,
        agencyName,
      });

      // ✅ If Critical, store in "critical_agencies"
      if (forType === "Critical") {
        await criticalCollection.insertOne({
          AgencyId: agencyId,
          Location: { lat, lng },
        });
        console.log("[createAgency] Added to critical_agencies:", agencyId);
      }
      // ✅ If Non-Critical, store in "non_critical_agencies"
      else if (forType === "Non-Critical") {
        await nonCriticalCollection.insertOne({
          AgencyId: agencyId,
          Location: { lat, lng },
        });
        console.log("[createAgency] Added to non_critical_agencies:", agencyId);
      }

      return agencyId;
    } catch (error) {
      console.error("[createAgency] MongoDB Insert Error:", error);
      throw new Error("Database Insert Failed");
    }
  },


async  getAgencyDashboardCheck(agencyId) {
  try {
    if (!agencyId) throw new Error("Agency ID is required.");

    agencyId = String(agencyId);  // Ensure agencyId is a string

    const db = client.db("BillionEyes_V1");

    // Fetch agency details
    const agency = await db.collection("agencies").findOne(
      { AgencyId: agencyId },
      { projection: { AgencyName: 1, AgencyId: 1, _id: 0 } }
    );

    if (!agency) throw new Error("Agency not found.");

    console.log("[DEBUG] Found agency:", agency);

    // Fetch events assigned to this agency using flexible field match
    const assignedEvents = await db.collection("events")
      .find({
        $or: [
          { "assigned_agency.agencies": agency.AgencyId },
          { "assigned_agencies.agencies": agency.AgencyId }
        ]
      })
      .project({
        _id: 0,
        event_id: 1,
        description: 1,
        assigned_agency: 1,
        assigned_agencies: 1,
        assignment_time: 1,
        ground_staff: 1,
        incidentID: 1,
        userId: 1,
        location: 1,
        timestamp: 1,
        image_url: 1,
        exif: 1,
        status: 1,
        incidents: 1,
      })
      .toArray();

    console.log("[DEBUG] Raw Assigned Events from DB:", assignedEvents);

    
    const formattedEvents = await Promise.all(assignedEvents.map(async (event) => {
      const firstIncident = event.incidents?.[0] || null;
      console.log("[DEBUG] First Incident:", firstIncident);
    
      // Choose the image URL from incident or event
      let originalImageUrl = firstIncident?.image_url || event.image_url || null;
      let proxyImageUrl = originalImageUrl;
    
      if (originalImageUrl) {
        try {
          const urlParts = new URL(originalImageUrl);
          const pathSegments = urlParts.pathname.split('/').filter(Boolean); // removes empty strings
    
          if (pathSegments.length >= 3) {
            const bucket = pathSegments[0];
            const year = pathSegments[1];
            const filename = pathSegments.slice(2).join('/'); // In case filename has slashes
    
            // You can replace 'localhost' with your actual domain or use a config value
            proxyImageUrl = `http://localhost/backend/${bucket}/${year}/${filename}`;
          }
        } catch (err) {
          console.warn("[WARN] Invalid originalImageUrl format:", originalImageUrl);
        }
      }
    
      return {
        event_id: event.event_id,
        description: event.description,
        status: event.status,
        assignment_time: firstIncident?.timestamp?.$date || event.assignment_time || null,
        latitude: firstIncident?.location?.coordinates?.[1] || event.location?.coordinates?.[1] || null,
        longitude: firstIncident?.location?.coordinates?.[0] || event.location?.coordinates?.[0] || null,
        image_url: proxyImageUrl,  // ✅ Use proxied image URL
        ground_staff: event.ground_staff || [],
        incidentID: event.incidentID || null,
        userId: event.userId || null,
        exif: event.exif || null,
        timestamp: event.timestamp instanceof Date ? event.timestamp.toISOString() : event.timestamp,
        assigned_agency: event.assigned_agency || event.assigned_agencies || null,
      };
    }));

    console.log("[DEBUG] Processed Events:", formattedEvents);

    return {
      AgencyName: agency.AgencyName,
      AgencyId: agency.AgencyId,
      assignedEvents: formattedEvents,
    };
  } catch (error) {
    console.error("[ERROR] getAgencyDashboardCheck:", error.message);
    throw new Error(error.message);
  }
}



,
  async updateEventStatus(event_id, newStatus) {
    try {
      // Use `this.getEventsCollection()` to access the method
      const eventCollection = await this.getEventsCollection();

      const result = await eventCollection.updateOne(
        { event_id: event_id },
        { $set: { status: newStatus } }
      );

      return result;
    } catch (error) {
      console.error("[updateEventStatus] Database Error:", error);
      throw new Error("Database Error");
    }
  },

  // async getEventById(event_id) {
  //   try {
  //     const eventCollection = await this.getEventsCollection();
  //     return await eventCollection.findOne(
  //       { event_id: event_id },
  //       { projection: { status: 1, _id: 0 } }
  //     );
  //   } catch (error) {
  //     console.error("[getEventById] Database Error:", error);
  //     throw new Error("Database Error");
  //   }
  // }
  // ,


  async getEventsCollection() {
    if (!client.topology || !client.topology.isConnected()) {
      await client.connect();
    }
    const db = client.db("BillionEyes_V1");
    return db.collection("events");
  },

  async getEventById(event_id, fields = [], includeImageUrl = true) {
    try {
      const eventCollection = await this.getEventsCollection();
  
      // Prepare the projection object
      let projection = {
        event_id: 1,
        assignment_time: 1,
        description: 1,
        ground_staff: 1,
        ...fields.reduce((acc, field) => ({ ...acc, [field]: 1 }), {}),
      };
  
      if (includeImageUrl) {
        projection.image_url = {
          $concat: [
            "http://minio:9000/billion-eye-images/",
            { $substr: [{ $toString: "$assignment_time" }, 0, 10] },
            "/I-",
            { $substr: [{ $toString: "$assignment_time" }, 11, 8] },
            ".jpg"
          ]
        };
      }
  
      const eventData = await eventCollection.aggregate([
        { $match: { event_id: event_id } },
        {
          $project: {
            ...projection,
            incidents: {
              $map: {
                input: "$incidents",
                as: "incident",
                in: {
                  image_url: "$$incident.image_url"
                }
              }
            }
          }
        }
      ]).toArray();
  
      if (eventData.length === 0) return null;
  
      const event = eventData[0];
  
      // 🔁 Convert event.image_url to proxied URL
      const firstIncident = event.incidents?.[0] || null;
      let originalImageUrl = firstIncident?.image_url || event.image_url || null;
  
      if (originalImageUrl) {
        try {
          const urlParts = new URL(originalImageUrl);
          const pathSegments = urlParts.pathname.split('/').filter(Boolean);
  
          if (pathSegments.length >= 3) {
            const bucket = pathSegments[0];
            const year = pathSegments[1];
            const filename = pathSegments.slice(2).join('/');
  
            event.image_url = `http://localhost/backend/${bucket}/${year}/${filename}`;
          }
        } catch (err) {
          console.warn("[WARN] Invalid originalImageUrl format:", originalImageUrl);
          event.image_url = originalImageUrl;
        }
      } else {
        event.image_url = null;
      }
  
      return event;
    } catch (error) {
      console.error("[getEventById] Database Error:", error);
      throw new Error("Database Error");
    }
  }
  
};

module.exports = AgencyModel;

// const db = client.db("BillionEyes_V1");