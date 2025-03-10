import { CronJob } from "cron";
import { backup } from "./backup.js";
import { env } from "./env.js";

console.log("NodeJS Version: " + process.version);

const sendNotification = async (envKey: keyof typeof env) => {
  if (!env[envKey]) {
    return;
  }

  if (typeof env[envKey] !== "string") {
    return;
  }

  try {
    console.log(`Sending notification to ${envKey}`);
    const res = await fetch(env[envKey] as string);
    if (!res.ok) {
      console.error(`Received ${res.status} from ${envKey} url`);
    }
  } catch (error) {
    console.error(`Error while calling ${envKey} url`, error);
  }
};

const tryBackup = async () => {
  try {
    await sendNotification("PRE_NOTIFICATION_URL");

    await backup();

    await sendNotification("SUCCESS_NOTIFICATION_URL");
  } catch (error) {
    console.error("Error while running backup: ", error);

    await sendNotification("ERROR_NOTIFICATION_URL");

    process.exit(1);
  }
};

if (env.RUN_ON_STARTUP || env.SINGLE_SHOT_MODE) {
  console.log("Running on start backup...");

  await tryBackup();

  if (env.SINGLE_SHOT_MODE) {
    console.log("Database backup complete, exiting...");
    process.exit(0);
  }
}

const job = new CronJob(env.BACKUP_CRON_SCHEDULE, async () => {
  await tryBackup();
});

job.start();

console.log("Backup cron scheduled...");
