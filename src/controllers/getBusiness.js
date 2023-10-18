import fs from "fs/promises"; // Usar fs.promises para trabajar con promesas

export async function getBusiness(req, res) {
    try {
        const business = await fs.readFile('./src/db/empresas.json', 'utf-8');
        const jsonBusiness = JSON.parse(business)
        const basicAllBusiness = []
        jsonBusiness.forEach((business) => {
            const newObj = {
                id: business.id,
                name: business.name,
            }
            basicAllBusiness.push(newObj)
        })
        res.status(200).json(basicAllBusiness);
    } catch (err) {
        console.error(err);
    }
}
