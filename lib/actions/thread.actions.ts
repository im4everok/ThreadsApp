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

export const fetchThreadById = async (threadId: string) => {
  try {
    connectToDb();

    // TODO: populate communities
    const thread = await Thread.findById(threadId)
      .populate({
        path: 'author',
        model: User,
        select: "_id id name image"
      })
      .populate({
        path: 'children',
        model: Thread,
        populate: [
          {
            path: 'author',
            model: User,
            select: "_id id name parentId name image"
          },
          {
            path: 'children',
            model: Thread,
            populate: {
              path: 'author',
              model: User,
              select: "_id id name parentId image"
            }
          }
        ]
      })

    return thread;
  } catch (error: any) {
    throw new Error(`Couldnt fetch thread by id: ${error.message}`);
  }
}

export const addCommentToThread = async (
  threadId: string,
  commentText: string,
  userId: string,
  path: string
) => {
  try {
    connectToDb();

    const originalThread = await Thread.findById(threadId);

    if (!originalThread || originalThread === null) throw new Error('Thread wasnt found');

    const commentThread = new Thread({
      text: commentText,
      author: userId,
      parentId: threadId
    })

    const savedCommentThread = await commentThread.save();

    originalThread.children.push(savedCommentThread._id);

    await originalThread.save();

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Couldnt add comment to thread: ${error.message}`);
  }
}