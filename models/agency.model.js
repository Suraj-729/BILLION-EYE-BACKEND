const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
const uri = process.env.DB_CONNECT;
const client = new MongoClient(uri);

async function getAgencyCollection() {
    if (!client.topology || !client.topology.isConnected()) {
        await client.connect();
    }
    const db = client.db("billoneyedata");
    return db.collection("agencies");
}

async function getCriticalCollection() {
    const db = client.db("billoneyedata");
    return db.collection("critical_agencies");
}

async function getNonCriticalCollection() {
    const db = client.db("billoneyedata");
    return db.collection("non_critical_agencies");
}
async function getGroundStaffCollection() {
    const db = client.db("billoneyedata");
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
            throw new Error("Invalid 'forType'. Must be 'Critical' or 'Non-Critical'.");
        }

        // ✅ Custom Agency ID logic
        const agencyId = `OD-${Math.floor(10 + Math.random() * 90)}-${Math.floor(10 + Math.random() * 90)}`;

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
            console.log("[createAgency] New agency inserted:", { agencyId, agencyName });

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

    async addGroundStaff(agencyId, staffName, phoneNumber) {
        const groundStaffCollection = await getGroundStaffCollection();
        const agencyCollection = await getAgencyCollection();
    
        // ✅ Fix 1: Define regex correctly (Remove backticks)
        const phoneRegex = /^\d{10}$/;
    
        // ✅ Fix 2: Use `.test()` instead of `.text()`
        if (!phoneRegex.test(phoneNumber)) {
            throw new Error("Invalid phone number. Must be 10 digits.");
        }
    
        const existingAgency = await agencyCollection.findOne({ AgencyId: agencyId });
        if (!existingAgency) {
            throw new Error("Agency not found. Please provide a valid AgencyId.");
        }
    
        const staffId = `GS-${Math.floor(1000 + Math.random() * 9000)}`;
        const staffDetails = {
            StaffId: staffId,
            AgencyId: agencyId,
            Name: staffName,
            PhoneNumber: phoneNumber,
            CreatedAt: new Date(),
        };
    
        try {
            await groundStaffCollection.insertOne(staffDetails);
            console.log("[addGroundStaff] New ground staff added:", { staffId, staffName });
    
            return staffId;
        } catch (error) {
            console.error("[addGroundStaff] MongoDB Insert Error:", error);
            throw new Error("Failed to add ground staff.");
        }
    },

    // async getGroundStaff(agencyId) {
    //     if (!agencyId) {
    //         throw new Error("Agency ID is required.");
    //     }
    
    //     const groundStaffCollection = await getGroundStaffCollection();
    
    //     // Fetch all ground staff under the given agency
    //     const staffList = await groundStaffCollection.find({ AgencyId: agencyId }).toArray();
    
    //     if (!staffList || staffList.length === 0) {
    //         throw new Error("No ground staff found for this agency.");
    //     }
    
    //     return staffList;
    // }
    async getGroundStaff(agencyId) {
        if (!agencyId || typeof agencyId !== "string") {
            throw new Error("Invalid Agency ID.");
        }
    
        const groundStaffCollection = await getGroundStaffCollection();
        const staffList = await groundStaffCollection.find({ AgencyId: agencyId }).toArray();
    
        if (!staffList.length) {
            throw new Error("No ground staff found for this agency.");
        }
    
        return staffList;
    }
    
    
};






// const addGroundStaff = async 
module.exports = AgencyModel;
