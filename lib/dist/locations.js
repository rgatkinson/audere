"use strict";
exports.__esModule = true;
var LocationType;
(function (LocationType) {
    LocationType["Hospital"] = "hospital";
    LocationType["CollegeCampus"] = "collegeCampus";
    LocationType["HomelessShelter"] = "homelessShelter";
    LocationType["ChildrensHospital"] = "childrensHospital";
    LocationType["ChildrensClinic"] = "childrensClinic";
    LocationType["Clinic"] = "clinic";
    LocationType["Childcare"] = "childcare";
    LocationType["Port"] = "port";
})(LocationType = exports.LocationType || (exports.LocationType = {}));
exports.Locations = {
    Harborview: {
        type: LocationType.Hospital,
        contactName: "Dr. Helen Y. Chu",
        contactPhone: "(206) 897-5318"
    },
    HarborviewLobby: {
        type: LocationType.HomelessShelter,
        contactName: "Dr. Helen Y. Chu",
        contactPhone: "(206) 897-5318"
    },
    ChildrensHospitalSeattle: {
        type: LocationType.ChildrensHospital,
        contactName: "Dr. Helen Y. Chu",
        contactPhone: "(206) 897-5318"
    },
    ChildrensHospitalBellevue: {
        type: LocationType.ChildrensHospital,
        contactName: "Dr. Helen Y. Chu",
        contactPhone: "(206) 897-5318"
    },
    HUB: {
        type: LocationType.CollegeCampus,
        contactName: "Dr. Helen Y. Chu",
        contactPhone: "(206) 897-5318"
    },
    UWHallHealth: {
        type: LocationType.CollegeCampus,
        contactName: "Dr. Helen Y. Chu",
        contactPhone: "(206) 897-5318"
    },
    HealthSciencesRotunda: {
        type: LocationType.CollegeCampus,
        contactName: "Dr. Helen Y. Chu",
        contactPhone: "(206) 897-5318"
    },
    HealthSciencesLobby: {
        type: LocationType.CollegeCampus,
        contactName: "Dr. Helen Y. Chu",
        contactPhone: "(206) 897-5318"
    },
    StMartins: {
        type: LocationType.HomelessShelter,
        contactName: "Dr. Helen Y. Chu",
        contactPhone: "(206) 897-5318"
    },
    DESC: {
        type: LocationType.HomelessShelter,
        contactName: "Dr. Helen Y. Chu",
        contactPhone: "(206) 897-5318"
    },
    PioneerSquare: {
        type: LocationType.HomelessShelter,
        contactName: "Dr. Helen Y. Chu",
        contactPhone: "(206) 897-5318"
    },
    UWSeaMar: {
        type: LocationType.Clinic,
        contactName: "Dr. Helen Y. Chu",
        contactPhone: "(206) 897-5318"
    },
    ChildrensSeaMar: {
        type: LocationType.ChildrensClinic,
        contactName: "Dr. Helen Y. Chu",
        contactPhone: "(206) 897-5318"
    },
    HutchKids: {
        type: LocationType.Childcare,
        contactName: "Dr. Helen Y. Chu",
        contactPhone: "(206) 897-5318"
    },
    UWDaycare: {
        type: LocationType.Childcare,
        contactName: "Dr. Helen Y. Chu",
        contactPhone: "(206) 897-5318"
    },
    SeaTacInternational: {
        type: LocationType.Port,
        contactName: "Dr. Helen Y. Chu",
        contactPhone: "(206) 897-5318"
    },
    Costco: {
        type: LocationType.Clinic,
        contactName: "Dr. Helen Y. Chu",
        contactPhone: "(206) 897-5318"
    },
    FredHutchLobby: {
        type: LocationType.Clinic,
        contactName: "Dr. Helen Y. Chu",
        contactPhone: "(206) 897-5318"
    }
};