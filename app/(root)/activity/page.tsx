import { fetchUser, getActivity } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const Page = async () => {
  const user = await currentUser();

  if (!user) return null;

  const userInfo = await fetchUser(user.id);

  if (!userInfo?.onboarded) redirect("/onboarding");

  const activity = await getActivity(userInfo._id);

  return (
    <section>
      <h1 className="head-text mb-10"></h1>

    <section className="mt-10 flex flex-col gap-5">
      {activity.length > 0 ? (
        <>
          {activity.map((act) => (
            <Link id={act._id} href={`/thread/${act.parentId}`}>
              <article className="activity-card">
                <Image
                src={act.author.image}
                alt="Profile picture"
                width={20}
                height={20}
                className="rounded-full object-cover"
                />
              </article>
            </Link>
          ))}
        </>
      ): (<>
      </>)}
    </section>

    </section>

  )
}

export default Page;