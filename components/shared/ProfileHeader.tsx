import Image from "next/image";

interface ProfileHeaderProps {
    accountId: string;
    authUserId: string;
    name: string;
    username: string;
    imgUrl: string;
    bio: string;
}

const ProfileHeader = ({
    accountId,
    authUserId,
    name,
    username,
    imgUrl,
    bio
}: ProfileHeaderProps) => {
    return (
        <div className="flex w-full flex-col justify-start">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative h-20 w-20 object-cover">
                        <Image
                            src={imgUrl}
                            alt="profile image"
                            fill
                            className="rounded-full object-cover shadow-2xl"
                        />
                    </div>
                </div>
            </div>
            <h1>Profile header</h1>
        </div>
    )
}

export default ProfileHeader;