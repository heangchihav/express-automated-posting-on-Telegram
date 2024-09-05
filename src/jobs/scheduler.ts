import {
  addDays,
  addWeeks,
  addMonths,
  isSameDay,
  isAfter,
  isBefore,
} from "date-fns";
import prisma from "../libs/prisma";
import { sendMessageToTelegram } from "../services/telegramService";

// Define the frequency map for scheduling
const frequencyMap: { [key: string]: (date: Date) => Date } = {
  daily: (date: Date) => addDays(date, 1),
  weekly: (date: Date) => addWeeks(date, 1),
  monthly: (date: Date) => addMonths(date, 1),
};

// Main function to check and send content
export const checkAndSendContent = async (): Promise<void> => {
  console.log("Checking content at", new Date().toISOString());
  const now = new Date();

  try {
    // Fetch all active contents
    const contents = await prisma.content.findMany({
      where: {
        active: true,
      },
      include: {
        chatGroups: true, // Include related chat groups
      },
    });

    console.log("Found content items:", contents);

    for (const content of contents) {
      const { scheduleAt, frequency, endDate, id, text, imageUrl, chatGroups } =
        content;

      // Collect all chat IDs to send messages to
      const chatIds = chatGroups.map((chatGroup) => chatGroup.chatId);

      // Case 1: Deactivate if endDate has passed
      if (endDate && isBefore(endDate, now)) {
        console.log(`Content ID ${id} has passed its endDate, deactivating.`);
        await prisma.content.update({
          where: { id },
          data: { active: false },
        });
        continue;
      }

      // Case 2: Immediate post if both scheduleAt and frequency are missing
      if (!scheduleAt && !frequency) {
        console.log("Posting immediately: No schedule and no frequency.");
        await sendMessageToTelegram(chatIds, text, imageUrl);
        await prisma.content.update({
          where: { id },
          data: { active: false },
        });
        continue;
      }

      // Case 3: Invalid frequency value - deactivate content
      if (frequency && !frequencyMap[frequency]) {
        console.log(
          `Invalid frequency "${frequency}" for content ID ${id}, deactivating.`
        );
        await prisma.content.update({
          where: { id },
          data: { active: false },
        });
        continue;
      }

      // Case 4: Scheduled for future - skip until the time arrives
      if (scheduleAt && isAfter(scheduleAt, now)) {
        console.log(
          `Content ID ${id} scheduled for future posting at: ${scheduleAt}`
        );
        continue;
      }

      // Case 5: ScheduleAt is in the past, post immediately based on the frequency
      if (scheduleAt && isBefore(scheduleAt, now)) {
        console.log("Content schedule is in the past, posting immediately.");
        await sendMessageToTelegram(chatIds, text, imageUrl);

        // Check if the next schedule is past the endDate
        if (endDate && isAfter(now, endDate)) {
          console.log(`Content ID ${id} reached endDate, deactivating.`);
          await prisma.content.update({
            where: { id },
            data: { active: false },
          });
          continue;
        }

        if (frequency) {
          // Calculate the next schedule date based on frequency
          const calculateNextSchedule = frequencyMap[frequency];
          const nextScheduleAt = calculateNextSchedule(scheduleAt);

          // Check if the next schedule exceeds the endDate
          if (endDate && isAfter(nextScheduleAt, endDate)) {
            console.log(
              `Next schedule date exceeds endDate, deactivating content ID ${id}.`
            );
            await prisma.content.update({
              where: { id },
              data: { active: false },
            });
          } else {
            await prisma.content.update({
              where: { id },
              data: { scheduleAt: nextScheduleAt },
            });
            console.log(
              `Next schedule at for content ID ${id}: ${nextScheduleAt}`
            );
          }
        } else {
          // No frequency - deactivate after posting
          await prisma.content.update({
            where: { id },
            data: { active: false },
          });
        }
        continue;
      }

      // Case 6: Post today without frequency and deactivate
      if (isSameDay(scheduleAt!, now) && !frequency) {
        console.log("Posting immediately and deactivating content.");
        await sendMessageToTelegram(chatIds, text, imageUrl);
        await prisma.content.update({
          where: { id },
          data: { active: false },
        });
        continue;
      }

      // Case 7: Post at scheduleAt and reschedule if frequency exists
      if (scheduleAt && isSameDay(scheduleAt, now) && frequency) {
        console.log("Sending message for content ID:", id);
        await sendMessageToTelegram(chatIds, text, imageUrl);

        // Calculate the next schedule date based on frequency
        const calculateNextSchedule = frequencyMap[frequency];
        const nextScheduleAt = calculateNextSchedule(scheduleAt);

        // Check if the next schedule exceeds the endDate
        if (endDate && isAfter(nextScheduleAt, endDate)) {
          console.log(
            `Next schedule exceeds endDate, deactivating content ID ${id}.`
          );
          await prisma.content.update({
            where: { id },
            data: { active: false },
          });
        } else {
          await prisma.content.update({
            where: { id },
            data: { scheduleAt: nextScheduleAt },
          });
          console.log(
            `Next schedule at for content ID ${id}: ${nextScheduleAt}`
          );
        }
      }
    }
  } catch (error) {
    console.error("Error checking scheduled content:", error);
  }
};

// Start the scheduler to check content every minute
console.log("Scheduler is starting...");
setInterval(checkAndSendContent, 60 * 1000);
