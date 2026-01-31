import Visitor from '../model/Visitor.model.js';

export const increaseVisitorCount = async (req, res) => {
    try {
        let visitor = await Visitor.findOne();

        // If no visitor document exists, create one
        if (!visitor) {
            visitor = await Visitor.create({count: 1});
        } else {
            visitor.count += 1;
            await visitor.save();
        }

        return res.status(200).json({
            success: true,
            visitors: visitor.count,
        });
    } catch (error) {
        console.error('Visitor count error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update visitor count',
        });
    }
};
