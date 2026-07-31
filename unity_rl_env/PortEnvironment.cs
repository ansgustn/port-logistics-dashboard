using System.Collections.Generic;
using UnityEngine;

public class PortEnvironment : MonoBehaviour
{
    public List<TruckAgent> truckAgents; // 환경 내 모든 트럭 에이전트 리스트
    public Transform[] terminalLocations; // 터미널들 위치

    void Start()
    {
        // 환경 초기화 시 모든 트럭들에게 무작위 목적지 할당 (병목 유도)
        foreach (var truck in truckAgents)
        {
            AssignRandomTerminal(truck);
        }
    }

    // 에이전트가 에피소드를 끝낼 때마다 새로운 목적지를 할당해 훈련의 다양성을 부여
    public void AssignRandomTerminal(TruckAgent agent)
    {
        if (terminalLocations.Length > 0)
        {
            int randomIndex = Random.Range(0, terminalLocations.Length);
            agent.targetTerminal = terminalLocations[randomIndex];
        }
    }
}
