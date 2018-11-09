import { Visit } from "../models/visit";

export async function putDocument(req, res) {
  await Visit.upsert({
    csruid: req.params.documentId,
    device: req.body.device,
    visit: req.body.visit
  });
  res.json({ Status: "SUCCESS" });
}
