using UnityEngine;
using Unity.MLAgents;
using Unity.MLAgents.Sensors;
using Unity.MLAgents.Actuators;

public class TruckAgent : Agent
{
    public Transform targetTerminal; // 목표 터미널 (목적지)
    public float moveSpeed = 10f;
    public float turnSpeed = 100f;

    private Rigidbody rb;
    private float initialDistance; // 시작 시 목적지까지의 거리

    public override void Initialize()
    {
        rb = GetComponent<Rigidbody>();
    }

    public override void OnEpisodeBegin()
    {
        // 1. 트럭과 타겟의 위치 초기화
        transform.localPosition = new Vector3(Random.Range(-20f, 20f), 0, Random.Range(-20f, 20f));
        transform.localRotation = Quaternion.Euler(0, Random.Range(0, 360f), 0);
        rb.velocity = Vector3.zero;
        rb.angularVelocity = Vector3.zero;

        targetTerminal.localPosition = new Vector3(Random.Range(-40f, 40f), 0, Random.Range(-40f, 40f));
        
        initialDistance = Vector3.Distance(transform.localPosition, targetTerminal.localPosition);
    }

    // 2. 환경 관측 (Observation)
    public override void CollectObservations(VectorSensor sensor)
    {
        // 목표까지의 상대적 거리 (Vector3)
        Vector3 directionToTarget = (targetTerminal.localPosition - transform.localPosition).normalized;
        sensor.AddObservation(directionToTarget.x);
        sensor.AddObservation(directionToTarget.z);
        
        // 현재 내 트럭의 속도 (Vector3)
        sensor.AddObservation(rb.velocity.x);
        sensor.AddObservation(rb.velocity.z);

        // 현재 목적지까지 남은 절대 거리
        sensor.AddObservation(Vector3.Distance(transform.localPosition, targetTerminal.localPosition));
    }

    // 3. 행동 및 보상 처리 (Action & Reward)
    public override void OnActionReceived(ActionBuffers actionBuffers)
    {
        // Discrete Actions (또는 Continuous)
        // [0]: 직진/후진 (1=직진, 2=후진, 0=정지)
        // [1]: 좌우 조향 (1=우, 2=좌, 0=유지)
        
        float moveAxis = 0f;
        float turnAxis = 0f;

        int moveAction = actionBuffers.DiscreteActions[0];
        int turnAction = actionBuffers.DiscreteActions[1];

        if (moveAction == 1) moveAxis = 1f;
        else if (moveAction == 2) moveAxis = -1f;

        if (turnAction == 1) turnAxis = 1f;
        else if (turnAction == 2) turnAxis = -1f;

        // 물리적 이동 적용
        transform.Rotate(transform.up, turnAxis * turnSpeed * Time.deltaTime);
        rb.AddForce(transform.forward * moveAxis * moveSpeed, ForceMode.Acceleration);

        // 시간 페널티 (정체 구간에서 가만히 있으면 페널티 누적)
        AddReward(-0.001f);

        // 거리 기반 보상 로직
        float currentDistance = Vector3.Distance(transform.localPosition, targetTerminal.localPosition);
        
        // 터미널 도착 성공!
        if (currentDistance < 2.5f)
        {
            AddReward(1.0f);
            EndEpisode(); // 한 사이클 종료 (새로운 트럭으로 리스폰)
        }
    }

    // 4. 인간(개발자) 수동 조작 테스트용
    public override void Heuristic(in ActionBuffers actionsOut)
    {
        var discreteActionsOut = actionsOut.DiscreteActions;
        discreteActionsOut[0] = 0;
        discreteActionsOut[1] = 0;

        if (Input.GetKey(KeyCode.W)) discreteActionsOut[0] = 1;
        else if (Input.GetKey(KeyCode.S)) discreteActionsOut[0] = 2;

        if (Input.GetKey(KeyCode.D)) discreteActionsOut[1] = 1;
        else if (Input.GetKey(KeyCode.A)) discreteActionsOut[1] = 2;
    }

    // 5. 충돌 감지 (벽이나 다른 트럭에 부딪히면 페널티)
    private void OnCollisionEnter(Collision collision)
    {
        if (collision.gameObject.CompareTag("Wall") || collision.gameObject.CompareTag("Truck"))
        {
            AddReward(-1.0f); // 충돌 페널티
            EndEpisode(); // 사고 발생 시 해당 트럭 리셋
        }
    }
}
