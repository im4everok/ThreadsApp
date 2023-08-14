import { FilterQuery, SortOrder } from "mongoose";
import Community from "../models/community.model";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectToDb } from "../mongoose";

export const addMemberToCommunity = async (
  communityId: string,
  memberId: string
) => {
  try {
    connectToDb();

    const community = await Community.findOne({ id: communityId });

    if (!community) {
      throw new Error("Community not found");
    }

    const user = await User.findOne({ id: memberId });

    if (!user) {
      throw new Error("User not found");
    }

    if (community.members.include(user._id)) {
      throw new Error("User is already a member of the community");
    }

    community.members.push(user._id);
    await community.save();

    user.communities.push(community._id);
    await user.save();

    return community;
  } catch (error: any) {
    throw new Error(`Couldn't add member to community: ${error.message}`);
  }
};

export const createCommunity = async (
  id: string,
  name: string,
  username: string,
  image: string,
  bio: string,
  createdById: string
) => {
  try {
    connectToDb();

    const user = await User.findOne({ id: createdById });

    if (!user) {
      throw new Error("User not found");
    }

    const newCommunity = new Community({
      id,
      name,
      username,
      image,
      bio,
      createdBy: user._id,
    });

    const createdCommunity = newCommunity.save();

    user.communities.push(createdCommunity._id);
    await user.save();

    return createdCommunity;
  } catch (error: any) {
    throw new Error(`Couldn't create community: ${error.message}`);
  }
};

export const fetchCommunityDetails = async (id: string) => {
  try {
    connectToDb();

    const communityDetails = await Community.findOne({ id }).populate([
      "createdBy",
      {
        path: "members",
        model: User,
        select: "name username image _id id",
      },
    ]);

    return communityDetails;
  } catch (error: any) {
    throw new Error(`Couldn't fetch community details: ${error.message}`);
  }
};

export const fetchCommunityPosts = async (id: string) => {
  try {
    connectToDb();

    const communityPosts = await Community.findById(id).populate({
      path: "threads",
      model: Thread,
      populate: [
        {
          path: "author",
          model: User,
          select: "name image id",
        },
        {
          path: "children",
          model: Thread,
          populate: {
            path: "author",
            model: User,
            select: "image _id",
          },
        },
      ],
    });

    return communityPosts;
  } catch (error: any) {
    throw new Error(`Couldn't fetch community posts: ${error.message}`);
  }
};

export const fetchCommunities = async ({
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}) => {
  try {
    connectToDb();

    const skip = (pageNumber - 1) * pageSize;

    const regex = new RegExp(searchString, "i");

    const query: FilterQuery<typeof Community> = {};

    if (searchString.trim() !== "") {
      query.$or = [
        { name: { $regex: regex } },
        { username: { $regex: regex } },
      ];
    }

    const sortOptions = { createdAt: sortBy };

    const communitiesQuery = Community.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize)
      .populate("members");

    const totalCount = await Community.countDocuments(query);

    const communities = await communitiesQuery.exec();

    const isNext = totalCount > communities.length + skip;

    return { communities, isNext };
  } catch (error: any) {
    throw new Error(`Couldn't fetch activity: ${error.message}`);
  }
};

export const deleteCommunity = async () => {
  try {
    connectToDb();
  } catch (error: any) {
    throw new Error(`Couldn't fetch activity: ${error.message}`);
  }
};

export const removeUserFromCommunity = async (
  userId: string,
  communityId: string
) => {
  try {
    connectToDb();

    const userIdObject = await User.findOne({ id: userId }, { _id: 1 });

    const communityIdObject = await Community.findOne(
      { id: communityId },
      { _id: 1 }
    );

    if (!userIdObject) {
      throw new Error("User not found");
    }

    if (!communityIdObject) {
      throw new Error("Community not found");
    }

    await Community.updateOne(
      { _id: communityIdObject._id },
      { $pull: { members: userIdObject._id } }
    );

    await User.updateOne(
      { _id: userIdObject._id },
      { $pull: { communities: communityIdObject._id } }
    );

    return { success: true };
  } catch (error: any) {
    throw new Error(`Couldn't remove user from community: ${error.message}`);
  }
};

export const updateCommunityInfo = async (
  communityId: string,
  name: string,
  username: string,
  image: string
) => {
  try {
    connectToDb();

    const updatedCommunity = await Community.findOneAndUpdate(
      { id: communityId },
      { name, username, image }
    );

    if (!updatedCommunity) {
      throw new Error("Community not found");
    }

    return updatedCommunity;
  } catch (error: any) {
    throw new Error(`Couldn't update community info: ${error.message}`);
  }
};
