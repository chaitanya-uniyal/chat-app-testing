import useGetConversations from "../../hooks/useGetConversations.ts";
import { getRandomEmoji } from "../../utils/emojis.ts";
import Conversation from "./Conversation";

const Conversations = () => {
	const { conversations, loading } = useGetConversations();
	return (
		<div className='py-2 flex flex-col overflow-auto'>
			{conversations.map((conversation) => (
				<Conversation key={conversation.id} conversation={conversation} emoji={getRandomEmoji()} />
			))}
			{loading ? <span className='loading loading-spinner mx-auto' /> : null}
		</div>
	);
};
export default Conversations;