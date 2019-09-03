package EbPhotoStoreNative;

import java.util.Map;

public class PatientEncounter {
  private String workerFirstName;
  private String workerLastName;
  private String workerNotes;
  private String workerPhone;
  private String workerUID;
  private String patientFirstName;
  private String patientLastName;
  private String patientPhone;
  private String patientID;
  private String patientInfo;

  public PatientEncounter(Map<String, String> data) {
    this.workerFirstName = data.get(workerFirstName);
    this.workerLastName = data.get(workerLastName);
    this.workerNotes = data.get(workerNotes);
    this.workerPhone = data.get(workerPhone);
    this.workerUID = data.get(workerUID);
    this.patientFirstName = data.get(patientFirstName);
    this.patientLastName = data.get(patientLastName);
    this.patientPhone = data.get(patientPhone);
    this.patientID = data.get(patientID);
    this.patientInfo = data.get(patientInfo);
  }

  public PatientEncounter() {
  }

  public String getWorkerFirstName() {
    return workerFirstName;
  }

  public void setWorkerFirstName(String workerFirstName) {
    this.workerFirstName = workerFirstName;
  }

  public String getWorkerLastName() {
    return workerLastName;
  }

  public void setWorkerLastName(String workerLastName) {
    this.workerLastName = workerLastName;
  }

  public String getWorkerNotes() {
    return workerNotes;
  }

  public void setWorkerNotes(String workerNotes) {
    this.workerNotes = workerNotes;
  }

  public String getWorkerPhone() {
    return workerPhone;
  }

  public void setWorkerPhone(String workerPhone) {
    this.workerPhone = workerPhone;
  }

  public String getWorkerUID() {
    return workerUID;
  }

  public void setWorkerUID(String workerUID) {
    this.workerUID = workerUID;
  }

  public String getPatientFirstName() {
    return patientFirstName;
  }

  public void setPatientFirstName(String patientFirstName) {
    this.patientFirstName = patientFirstName;
  }

  public String getPatientLastName() {
    return patientLastName;
  }

  public void setPatientLastName(String patientLastName) {
    this.patientLastName = patientLastName;
  }

  public String getPatientPhone() {
    return patientPhone;
  }

  public void setPatientPhone(String patientPhone) {
    this.patientPhone = patientPhone;
  }

  public String getPatientID() {
    return patientID;
  }

  public void setPatientID(String patientID) {
    this.patientID = patientID;
  }

  public String getPatientInfo() {
    return patientInfo;
  }

  public void setPatientInfo(String patientInfo) {
    this.patientInfo = patientInfo;
  }
}
