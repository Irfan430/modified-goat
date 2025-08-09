const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const router = express.Router();

module.exports = function ({
  isAuthenticated, isVeryfiUserIDFacebook, isAdmin,
  threadsData, usersData, createLimiter, imageExt, videoExt, audioExt
}) {

  const writeJSONPretty = (p, data) => fs.writeJsonSync(p, data, { spaces: 2 });

  const cfgPath = path.normalize(process.cwd() + "/config.json");
  const cfgCommandsPath = path.normalize(process.cwd() + "/configCommands.json");

  // ---------- Admin Management ----------
  router.get("/admin", [isAuthenticated, isVeryfiUserIDFacebook, isAdmin], async (req, res) => {
    const config = fs.readJsonSync(cfgPath);
    res.render("admin", { admins: config.adminBot || [] });
  });

  router.post("/admin/add", [isAuthenticated, isVeryfiUserIDFacebook, isAdmin], async (req, res) => {
    const { fbid } = req.body;
    if (!fbid) return res.status(400).send({ status: "error", message: "fbid required" });
    const config = fs.readJsonSync(cfgPath);
    config.adminBot = Array.from(new Set([...(config.adminBot || []), String(fbid)]));
    writeJSONPretty(cfgPath, config);
    return res.send({ status: "success", message: "Admin added", admins: config.adminBot });
  });

  router.post("/admin/remove", [isAuthenticated, isVeryfiUserIDFacebook, isAdmin], async (req, res) => {
    const { fbid } = req.body;
    const config = fs.readJsonSync(cfgPath);
    config.adminBot = (config.adminBot || []).filter(id => id != String(fbid));
    writeJSONPretty(cfgPath, config);
    return res.send({ status: "success", message: "Admin removed", admins: config.adminBot });
  });

  // ---------- Commands Management ----------
  router.get("/commands", [isAuthenticated, isVeryfiUserIDFacebook, isAdmin], async (req, res) => {
    const { GoatBot } = global;
    const configCommands = fs.readJsonSync(cfgCommandsPath);
    const commandUnload = new Set(configCommands.commandUnload || []);
    const eventUnload = new Set((configCommands.commandEventUnload || []));

    const rows = [];
    for (const [name, cmd] of GoatBot.commands) {
      const loc = (cmd && cmd.location) || "";
      const type = loc.includes("/scripts/events/") ? "event" : "cmd";
      const file = path.basename(loc);
      const category = (cmd && cmd.config && cmd.config.category) || "";
      const status = (type === "event" ? !eventUnload.has(file) : !commandUnload.has(file)) ? "loaded" : "disabled";
      rows.push({ name, file, type, category, status });
    }
    rows.sort((a,b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
    res.render("commands", { rows });
  });

  router.post("/commands/toggle", [isAuthenticated, isVeryfiUserIDFacebook, isAdmin], async (req, res) => {
    const { file, type, action } = req.body;
    if (!file || !type || !action) return res.status(400).send({ status: "error", message: "file/type/action required" });
    const configCommands = fs.readJsonSync(cfgCommandsPath);
    configCommands.commandUnload = configCommands.commandUnload || [];
    configCommands.commandEventUnload = configCommands.commandEventUnload || [];

    const list = (type === "event") ? configCommands.commandEventUnload : configCommands.commandUnload;
    const i = list.indexOf(file);
    if (action === "disable" && i === -1) list.push(file);
    if (action === "enable" && i > -1) list.splice(i,1);

    writeJSONPretty(cfgCommandsPath, configCommands);
    return res.send({ status: "success", message: "Updated. Restart bot to apply." });
  });

  // Optional: Upload new command file (saved; load on restart)
  router.post("/commands/upload", [isAuthenticated, isVeryfiUserIDFacebook, isAdmin], async (req, res) => {
    if (!req.files || !req.files.file) return res.status(400).send({ status: "error", message: "No file uploaded" });
    const f = req.files.file;
    const targetDir = f.name.endsWith(".js") && f.name.includes("event") ? "/scripts/events" : "/scripts/cmds";
    const dest = path.normalize(process.cwd() + targetDir + "/" + f.name);
    await fs.ensureDir(path.dirname(dest));
    await f.mv(dest);
    return res.send({ status: "success", message: "Uploaded. Restart bot to load.", path: dest });
  });

  return router;
};
