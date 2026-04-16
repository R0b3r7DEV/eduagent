"""LangGraph agent graph definition — wires nodes and edges."""

from langgraph.graph import END, StateGraph

from app.agent.state import AgentState

# TODO: import node functions once implemented
# from app.agent.nodes.orchestrator import orchestrator_node
# from app.agent.nodes.tutor import tutor_node
# from app.agent.nodes.summarizer import summarizer_node
# from app.agent.nodes.task_manager import task_manager_node
# from app.agent.nodes.rag_retriever import rag_retriever_node


def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    # Nodes will be added here as they are implemented
    # graph.add_node("orchestrator", orchestrator_node)
    # graph.add_node("rag_retriever", rag_retriever_node)
    # graph.add_node("tutor", tutor_node)
    # graph.add_node("summarizer", summarizer_node)
    # graph.add_node("task_manager", task_manager_node)

    # graph.set_entry_point("orchestrator")
    # Conditional edges defined by intent routing

    return graph


# Compiled graph — import this in services
agent_graph = build_graph().compile()
