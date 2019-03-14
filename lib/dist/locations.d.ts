export declare enum LocationType {
    Hospital = "hospital",
    CollegeCampus = "collegeCampus",
    HomelessShelter = "homelessShelter",
    ChildrensHospital = "childrensHospital",
    ChildrensClinic = "childrensClinic",
    Clinic = "clinic",
    Childcare = "childcare",
    Port = "port",
    FredHutch = "fredHutch"
}
export declare const Locations: {
    [key: string]: {
        type: LocationType;
        contactName: string;
        contactPhone: string;
    };
};
