using UnityEngine;
using UnityEngine.AI;

public class TruckController : MonoBehaviour
{
    private NavMeshAgent agent;
    
    public bool isWaiting = false;
    public float waitTime = 0f;

    void Awake()
    {
        // Unity의 내비게이션 메쉬를 활용하여 목적지까지 길찾기 이동
        agent = GetComponent<NavMeshAgent>();
    }

    public void SetDestination(Transform destination)
    {
        agent.SetDestination(destination.position);
        isWaiting = false;
    }

    void Update()
    {
        // 길은 막혔거나 터미널에 도달했으나 대기열에 걸려있는 상태(속도 0) 판별
        if (agent.velocity.sqrMagnitude < 0.1f && agent.remainingDistance > 0f)
        {
            isWaiting = true;
            waitTime += Time.deltaTime; // 멈춰있는 시간 누적
        }
        else
        {
            isWaiting = false;
        }
    }
}
