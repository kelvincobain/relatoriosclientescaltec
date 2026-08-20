...existing content...
                  {(() => {
                    const filteredData = filterPeriod(calRows, selection);
                    let totalCancelamentosReais = 0;
                    const cancelamentosPorMes: Record<string, number> = {
                      'Jan': 0, 'Fev': 0, 'Mar': 0, 'Abr': 0, 'Mai': 0, 'Jun': 0,
                      'Jul': 0, 'Ago': 0, 'Set': 0, 'Out': 0, 'Nov': 0, 'Dez': 0
                    };
                    const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                    const grupos: Record<string, { statusList: string[], mes: string }> = {};

                    filteredData.forEach((row: any) => {
                      const cliente = (row[COL.client] || '').toString().trim();
                      const cidade = (row[COL.city] || '').toString().trim();
                      const dataRaw = (row[COL.plannedDelivery] || '').toString().trim();
                      const status = (row[COL.status] || '').toString().toLowerCase().trim();

                      if (!cliente || !cidade || !dataRaw) return;

                      const dataSemHora = dataRaw.split(' ')[0] || ''; 
                      const chave = `${cliente}|${cidade}|${dataSemHora}`;

                      if (!grupos[chave]) {
                        const partes = dataSemHora.split('/');
                        const mesIndex = partes.length > 1 ? parseInt(partes[1], 10) - 1 : 0;
                        grupos[chave] = {
                          statusList: [],
                          mes: nomesMeses[mesIndex] || 'Jan'
                        };
                      }
                      grupos[chave].statusList.push(status);
                    });

                    Object.values(grupos).forEach(grupo => {
                      const isReal = grupo.statusList.length > 0 && grupo.statusList.every(s => s.includes('cancelado'));
                      if (isReal) {
                        totalCancelamentosReais++;
                        cancelamentosPorMes[grupo.mes as keyof typeof cancelamentosPorMes]++;
                      }
                    });

                    const chartData = Object.keys(cancelamentosPorMes)
                      .map(mes => ({ name: mes, quantidade: cancelamentosPorMes[mes as keyof typeof cancelamentosPorMes] }))
                      .filter(item => item.quantidade > 0);

                    return { totalCancelamentosReais, chartData };
                  })().chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={(() => {
                        const filteredData = filterPeriod(calRows, selection);
                        const cancelamentosPorMes: Record<string, number> = {
                          'Jan': 0, 'Fev': 0, 'Mar': 0, 'Abr': 0, 'Mai': 0, 'Jun': 0,
                          'Jul': 0, 'Ago': 0, 'Set': 0, 'Out': 0, 'Nov': 0, 'Dez': 0
                        };
                        const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                        const grupos: Record<string, { statusList: string[], mes: string }> = {};
                        filteredData.forEach((row: any) => {
                          const cliente = (row[COL.client] || '').toString().trim();
                          const cidade = (row[COL.city] || '').toString().trim();
                          const dataRaw = (row[COL.plannedDelivery] || '').toString().trim();
                          const status = (row[COL.status] || '').toString().toLowerCase().trim();
                          if (!cliente || !cidade || !dataRaw) return;
                          const dataSemHora = dataRaw.split(' ')[0] || ''; 
                          const chave = `${cliente}|${cidade}|${dataSemHora}`;
                          if (!grupos[chave]) {
                            const partes = dataSemHora.split('/');
                            const mesIndex = partes.length > 1 ? parseInt(partes[1], 10) - 1 : 0;
                            grupos[chave] = { statusList: [], mes: nomesMeses[mesIndex] || 'Jan' };
                          }
                          grupos[chave].statusList.push(status);
                        });
                        Object.values(grupos).forEach(grupo => {
                          const isReal = grupo.statusList.length > 0 && grupo.statusList.every(s => s.includes('cancelado'));
                          if (isReal) cancelamentosPorMes[grupo.mes as keyof typeof cancelamentosPorMes]++;
                        });
                        return Object.keys(cancelamentosPorMes).map(mes => ({ name: mes, quantidade: cancelamentosPorMes[mes as keyof typeof cancelamentosPorMes] }))
                          .filter(item => item.quantidade > 0);
                      })()} margin={{ top: 35, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid stroke={GRID} vertical={false} strokeDasharray={GRID_DASH} />
                        <XAxis dataKey="name" {...X_AXIS_PROPS} />
                        <YAxis {...Y_AXIS_HIDDEN} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.5)]} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                          <Bar
                            name="Cancelamentos Reais"
                            dataKey="quantidade"
                            fill="#f59e0b"
                            radius={[4, 4, 0, 0]}
                            barSize={32}
                          >
                            <LabelList
                              dataKey="quantidade"
                              position="top"
                              fill="#FFFFFF"
                              style={{ fontSize: 13, fontWeight: 700 }}
                              dy={-8}
                            />
                          </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState label="0 cancelamentos identificados no período" />
                  )}
...existing content...