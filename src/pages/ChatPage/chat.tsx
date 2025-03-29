import Chat from "../../components/chat/Chat";
import PageBreadcrumb from "../../components/chat/Chat";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";


export default function BasicTables() {
    return (
        <>
            <PageMeta
                title="HikeHub | Chats"
                description=""
            />
            <Chat />
        </>
    );
}
