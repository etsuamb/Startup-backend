import { redirect } from "next/navigation";

export default function StartupMentorChatPage() {
	redirect("/startup/chat?kind=mentor");
}
