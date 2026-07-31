using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class TrafficSimulator : MonoBehaviour
{
    [Header("Simulation Settings")]
    public GameObject truckPrefab;
    public Transform spawnPoint;
    public Transform[] terminals; // 분산시킬 게이트/터미널 목록
    
    // AI(ML-Agents)가 병목 해결을 위해 실시간으로 조절할 수 있는 유입 파라미터
    [Range(0.5f, 10f)]
    public float spawnRateSeconds = 2.0f; 
    
    private float timer = 0f;
    private int totalSpawned = 0;

    void Update()
    {
        timer += Time.deltaTime;
        
        // 지정된 시간 간격마다 화물차량 생성 (Spawning)
        if (timer >= spawnRateSeconds)
        {
            SpawnTruck();
            timer = 0f;
        }
    }

    void SpawnTruck()
    {
        GameObject newTruck = Instantiate(truckPrefab, spawnPoint.position, Quaternion.identity);
        TruckController controller = newTruck.GetComponent<TruckController>();
        
        // 무작위 터미널로 목적지 할당 (추후 AI의 라우팅 분배 로직으로 교체되는 지점)
        Transform randomTerminal = terminals[Random.Range(0, terminals.Length)];
        controller.SetDestination(randomTerminal);
        
        totalSpawned++;
    }

    // 강화학습(RL) 에이전트 평가용 보상 함수 (값이 높을수록 AI가 학습을 잘한 것)
    public float GetCurrentReward()
    {
        float totalWaitTimePenalty = CalculateTotalWaitTime();
        float throughputReward = totalSpawned * 5f; // 전체 처리량에 따른 기본 보상
        
        // 전체 처리량은 유지하되, 대기 시간 페널티를 최소화하도록 유도
        return throughputReward - totalWaitTimePenalty;
    }
    
    private float CalculateTotalWaitTime()
    {
        float penalty = 0f;
        TruckController[] activeTrucks = FindObjectsOfType<TruckController>();
        foreach (var truck in activeTrucks)
        {
            if (truck.isWaiting)
            {
                penalty += truck.waitTime; // 멈춰있는 시간에 비례하여 페널티 부과
            }
        }
        return penalty;
    }
}
