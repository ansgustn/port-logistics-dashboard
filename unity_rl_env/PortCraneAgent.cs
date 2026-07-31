using UnityEngine;
using Unity.MLAgents;
using Unity.MLAgents.Sensors;
using Unity.MLAgents.Actuators;

public class PortCraneAgent : Agent
{
    [Header("Crane Configuration")]
    public Transform craneTrolley; // 크레인 트롤리
    public Transform spreader;     // 컨테이너 집게 (Spreader)
    public Transform targetContainer; // 운반할 컨테이너
    public Transform targetTrailer;   // 적재할 트럭 트레일러

    public float moveSpeed = 5.0f;
    public float liftSpeed = 3.0f;

    private bool isContainerLatched = false;

    public override void OnEpisodeBegin()
    {
        // 1. 크레인 위치 초기화
        craneTrolley.localPosition = new Vector3(0, 10f, 0);
        spreader.localPosition = new Vector3(0, 8f, 0);

        // 2. 컨테이너 및 트럭 무작위 위치 스폰
        targetContainer.localPosition = new Vector3(Random.Range(-15f, 15f), 1f, Random.Range(-5f, 5f));
        targetTrailer.localPosition = new Vector3(Random.Range(-15f, 15f), 0.5f, Random.Range(-5f, 5f));

        isContainerLatched = false;
    }

    public override void CollectObservations(VectorSensor sensor)
    {
        // 트롤리 위치 및 스프레더 높이
        sensor.AddObservation(craneTrolley.localPosition.x);
        sensor.AddObservation(spreader.localPosition.y);

        // 목표 컨테이너와의 상대 위치
        Vector3 containerOffset = targetContainer.localPosition - spreader.position;
        sensor.AddObservation(containerOffset.x);
        sensor.AddObservation(containerOffset.y);

        // 적재 트레일러와의 상대 위치
        Vector3 trailerOffset = targetTrailer.localPosition - spreader.position;
        sensor.AddObservation(trailerOffset.x);
        sensor.AddObservation(trailerOffset.y);

        // 컨테이너 체착 여부
        sensor.AddObservation(isContainerLatched ? 1.0f : 0.0f);
    }

    public override void OnActionReceived(ActionBuffers actionBuffers)
    {
        // Action [0]: 트롤리 이동 (-1=좌, 1=우, 0=정지)
        // Action [1]: 스프레더 승강 (-1=하강, 1=상승, 0=유지)
        // Action [2]: 컨테이너 래치/클램프 (1=체착)

        float trolleyMove = actionBuffers.ContinuousActions[0];
        float spreaderLift = actionBuffers.ContinuousActions[1];

        // 크레인 이동 적용
        craneTrolley.Translate(Vector3.right * trolleyMove * moveSpeed * Time.deltaTime);
        spreader.Translate(Vector3.up * spreaderLift * liftSpeed * Time.deltaTime);

        // 기본 단위시간 페널티
        AddReward(-0.0005f);

        // 1단계: 컨테이너 잡기 성공
        float distToContainer = Vector3.Distance(spreader.position, targetContainer.position);
        if (!isContainerLatched && distToContainer < 1.0f)
        {
            isContainerLatched = true;
            AddReward(0.5f); // 래치 성공 보상
        }

        // 2단계: 트레일러 위 정밀 적재 성공
        if (isContainerLatched)
        {
            targetContainer.position = spreader.position; // 트롤리에 고정 이동

            float distToTrailer = Vector3.Distance(targetContainer.position, targetTrailer.position);
            if (distToTrailer < 1.2f)
            {
                AddReward(2.0f); // 최종 적재 성공 최대 보상
                EndEpisode();
            }
        }
    }
}
