"use server"

import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectToDb } from "../mongoose";

interface CreateThreadParams {
  text: string;
  author: string;
  communityId: string | null;
  path: string;
}

export const createThread = async ({ text, author, communityId, path }: CreateThreadParams) => {
  try {
    connectToDb();

    const createdThread = await Thread.create({
      text,
      author,
      community: null,
    });

    await User.findByIdAndUpdate(author, {
      $push: { threads: createdThread._id },
    });

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Couldnt create/update user: ${error.message}`);
  }
};

interface FetchThreadsParams {
  page: number;
  pageSize: number;
}

export const fetchThreads = async ({
  page = 1,
  pageSize = 10
}: FetchThreadsParams) => {
  try {
    connectToDb();

    const skip = (page - 1) * pageSize;

    // threads without parents -> top level threads
    const threadQuery = Thread.find({ parentId: { $exists: false } })
      .sort({ createdAt: 'desc' })
      .skip(skip)
      .limit(pageSize)
      .populate({ path: 'author', model: User })
      .populate({
        path: 'children',
        populate: {
          path: 'author',
          model: User,
          select: '_id name parentId image'
        }
      });

    const totalCount = await Thread.countDocuments({ parentId: { $exists: false } })

    const threads = await threadQuery.exec();

    const isNext = totalCount > skip + threads.length;

    return { threads, isNext };
  } catch (error: any) {
    throw new Error(`Couldnt create/update user: ${error.message}`);
  }
}