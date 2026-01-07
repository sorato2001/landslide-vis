export async function runANNModel() {
  await fetch('http://localhost:5000/run_ann', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file: 'reclass.csv'
    })
  })

  // 当前阶段不做可视化
  console.log('ANN 预测完成，已生成预测值文件')
}
